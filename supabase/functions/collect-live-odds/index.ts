import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phase 3B: Live odds collection for in-play arbitrage
const LIVE_MARKET_TYPES = ['h2h', 'spreads', 'totals'];
const MARKET_MAP: Record<string, string> = {
  'h2h': 'Match Winner',
  'spreads': 'Spread/Handicap',
  'totals': 'Over/Under',
};

const THRESHOLDS = {
  live: 0.985,  // More lenient for live markets (1.5% minimum profit)
};

function detectArbitrage(outcomes: Array<{ odds: number }>): { isArb: boolean; profitMargin: number; arbPercent: number } {
  const totalInverse = outcomes.reduce((sum, o) => sum + 1 / o.odds, 0);
  const isArb = totalInverse < THRESHOLDS.live;
  const profitMargin = isArb ? ((1 / totalInverse) - 1) * 100 : 0;
  return { isArb, profitMargin, arbPercent: totalInverse * 100 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const API_KEY = '928365076820fc52c6d713adefbf0421';
    const BASE_URL = 'https://api.the-odds-api.com/v4';
    
    // Step 1: Fetch active sports
    console.log('Fetching active sports for live odds...');
    const sportsResponse = await fetch(`${BASE_URL}/sports/?apiKey=${API_KEY}`);
    if (!sportsResponse.ok) {
      throw new Error(`Failed to fetch sports: ${sportsResponse.status}`);
    }
    const allSports = await sportsResponse.json();
    const activeSports = allSports
      .filter((sport: any) => sport.active === true)
      .map((sport: any) => sport.key);
    
    console.log(`Active sports for live betting: ${activeSports.length}`);
    const LIVE_SPORTS = activeSports.slice(0, 10); // Top 10 active sports
    
    const MAX_EVENTS_PER_SPORT = 10;
    const TIME_BUDGET_MS = 15000;
    const startTime = Date.now();

    console.log('Starting live odds collection...');

    let liveOpportunities: any[] = 0;
    let totalProcessedEvents = 0;

    for (const sportKey of LIVE_SPORTS) {
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        console.log(`Time budget exceeded, stopping at sport: ${sportKey}`);
        break;
      }

      try {
        console.log(`Fetching live odds for: ${sportKey}`);
        
        // Request live odds with inPlay=true parameter
        const marketsParam = LIVE_MARKET_TYPES.join(',');
        const url = `${BASE_URL}/sports/${sportKey}/odds/?regions=uk&markets=${marketsParam}&oddsFormat=decimal&apiKey=${API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          console.log(`Failed to fetch ${sportKey}: ${response.status}`);
          continue;
        }

        const oddsData = await response.json();
        
        // Filter for events that are happening now or very soon (within 2 hours)
        const liveOrUpcoming = oddsData.filter((e: any) => {
          const startTime = new Date(e.commence_time).getTime();
          const now = Date.now();
          const twoHoursFromNow = now + (2 * 60 * 60 * 1000);
          return startTime <= twoHoursFromNow && startTime > now - (90 * 60 * 1000); // Started within last 90 mins
        }).slice(0, MAX_EVENTS_PER_SPORT);

        console.log(`${sportKey}: Found ${liveOrUpcoming.length} live/upcoming events`);

        for (const event of liveOrUpcoming) {
          if (Date.now() - startTime > TIME_BUDGET_MS) break;

          const isLive = new Date(event.commence_time).getTime() < Date.now();
          
          // Create/update event with live status
          const eventKey = event.id || `${event.sport_key}_${event.home_team}_${event.away_team}`;
          const { data: eventData } = await supabase.from('events').upsert({ 
            event_key: eventKey, 
            sport_key: event.sport_key, 
            sport_title: event.sport_title, 
            commence_time: event.commence_time, 
            home_team: event.home_team, 
            away_team: event.away_team,
            is_live: isLive,
            updated_at: new Date().toISOString() 
          }, { onConflict: 'event_key' }).select().single();
          
          if (!eventData) continue;
          totalProcessedEvents++;

          // Store live market odds
          for (const bookmaker of event.bookmakers) {
            const { data: bookmakerData } = await supabase.from('bookmakers').upsert({ 
              key: bookmaker.key, 
              title: bookmaker.title, 
              updated_at: new Date().toISOString() 
            }, { onConflict: 'key' }).select().single();

            if (!bookmakerData) continue;

            for (const market of bookmaker.markets || []) {
              if (!MARKET_MAP[market.key]) continue;
              
              const marketLine = market.key === 'totals' || market.key === 'spreads' 
                ? parseFloat(market.outcomes[0]?.point || '0') 
                : null;
              
              await supabase.from('market_odds').insert({
                event_id: eventData.id,
                market_key: market.key,
                bookmaker_id: bookmakerData.id,
                outcomes: market.outcomes,
                market_line: marketLine,
                is_live: isLive,
                last_update: new Date().toISOString()
              });
            }
          }

          // Detect live arbitrage opportunities
          for (const marketType of LIVE_MARKET_TYPES) {
            if (Date.now() - startTime > TIME_BUDGET_MS) break;

            const { data: marketOdds } = await supabase
              .from('market_odds')
              .select('*, bookmakers(title)')
              .eq('event_id', eventData.id)
              .eq('market_key', marketType)
              .eq('is_live', isLive);

            if (!marketOdds || marketOdds.length < 2) continue;

            // Group by market line
            const lineGroups = new Map<string, any[]>();
            for (const odds of marketOdds) {
              const lineKey = odds.market_line ? odds.market_line.toString() : 'default';
              if (!lineGroups.has(lineKey)) lineGroups.set(lineKey, []);
              lineGroups.get(lineKey)!.push(odds);
            }

            for (const [line, oddsInGroup] of lineGroups) {
              if (oddsInGroup.length < 2) continue;

              const outcomeNames = new Set<string>();
              oddsInGroup.forEach(o => o.outcomes.forEach((out: any) => outcomeNames.add(out.name)));

              const outcomeArray = Array.from(outcomeNames);
              if (outcomeArray.length < 2) continue;
              
              // Find best odds for each outcome
              const bestOdds = new Map<string, any>();
              for (const outcome of outcomeArray) {
                for (const odds of oddsInGroup) {
                  const matchingOutcome = odds.outcomes.find((o: any) => o.name === outcome);
                  if (matchingOutcome && (!bestOdds.has(outcome) || matchingOutcome.price > bestOdds.get(outcome).odds)) {
                    bestOdds.set(outcome, {
                      name: outcome,
                      odds: matchingOutcome.price,
                      bookmaker: odds.bookmakers.title
                    });
                  }
                }
              }

              const combo = Array.from(bestOdds.values());
              if (combo.length !== outcomeArray.length) continue;

              const result = detectArbitrage(combo);
              if (result.isArb) {
                await supabase.from('arbitrage_opportunities').insert({
                  event_id: eventData.id,
                  outcomes: combo,
                  profit_margin: result.profitMargin,
                  arb_percent: result.arbPercent,
                  market_key: marketType,
                  market_display_name: MARKET_MAP[marketType],
                  market_line: line !== 'default' ? parseFloat(line) : null,
                  is_cross_market: false,
                  is_live: isLive,
                  opportunity_type: isLive ? 'live' : 'pre-match'
                });

                liveOpportunities++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error for ${sportKey}:`, error);
      }
    }

    console.log(`Processed ${totalProcessedEvents} live events, found ${liveOpportunities} opportunities`);

    return new Response(JSON.stringify({ 
      success: true, 
      eventsProcessed: totalProcessedEvents,
      opportunitiesFound: liveOpportunities
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
});
