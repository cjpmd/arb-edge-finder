import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phase 3A: Extended market coverage
const MARKET_TYPES = ['h2h', 'h2h_3way', 'spreads', 'totals', 'btts', 'draw_no_bet', 'double_chance'];
const MARKET_MAP: Record<string, { key: string; displayName: string }> = {
  'h2h': { key: 'h2h', displayName: 'Match Winner' },
  'h2h_3way': { key: 'h2h_3way', displayName: '3-Way (1X2)' },
  'spreads': { key: 'spreads', displayName: 'Spread/Handicap' },
  'totals': { key: 'totals', displayName: 'Over/Under' },
  'btts': { key: 'btts', displayName: 'Both Teams to Score' },
  'draw_no_bet': { key: 'draw_no_bet', displayName: 'Draw No Bet' },
  'double_chance': { key: 'double_chance', displayName: 'Double Chance' },
};

// Phase 3D: Sport-specific market priorities
const SPORT_PRIORITY_MARKETS: Record<string, string[]> = {
  soccer: ['h2h', 'btts', 'totals', 'double_chance', 'h2h_3way'],
  basketball: ['h2h', 'spreads', 'totals'],
  tennis: ['h2h'],
  cricket: ['h2h', 'totals'],
  americanfootball: ['h2h', 'spreads', 'totals'],
  default: ['h2h', 'spreads', 'totals']
};

// Phase 3E: Adaptive thresholds based on opportunity type
const THRESHOLDS = {
  pre_match: 0.995,     // 0.5% minimum profit - very lenient
  live: 0.996,          // 0.4% for live markets
  cross_market: 0.997,  // 0.3% for synthetic arbs
  high_volume: 0.998    // 0.2% for liquid markets
};

// Generic arbitrage detection with configurable threshold
function detectArbitrage(outcomes: Array<{ odds: number }>, threshold: number = THRESHOLDS.pre_match): { isArb: boolean; profitMargin: number; arbPercent: number } {
  const totalInverse = outcomes.reduce((sum, o) => sum + 1 / o.odds, 0);
  const isArb = totalInverse < threshold;
  const profitMargin = isArb ? ((1 / totalInverse) - 1) * 100 : 0;
  return { isArb, profitMargin, arbPercent: totalInverse * 100 };
}

// Phase 3C: Cross-market arbitrage detection helper
function detectCrossMarketArb(h2hOdds: any[], doubleChanceOdds: any[]): any[] {
  const opportunities: any[] = [];
  
  // Example: Home win from h2h vs Away/Draw from double_chance
  for (const h2h of h2hOdds) {
    const homeOdds = h2h.outcomes.find((o: any) => o.name.toLowerCase().includes('home'))?.price;
    if (!homeOdds) continue;
    
    for (const dc of doubleChanceOdds) {
      const awayDrawOdds = dc.outcomes.find((o: any) => 
        o.name.toLowerCase().includes('away') || o.name.toLowerCase().includes('draw')
      )?.price;
      
      if (awayDrawOdds) {
        const result = detectArbitrage([{ odds: homeOdds }, { odds: awayDrawOdds }], THRESHOLDS.cross_market);
        if (result.isArb) {
          opportunities.push({
            type: 'cross-market',
            homeBookmaker: h2h.bookmakers.title,
            awayDrawBookmaker: dc.bookmakers.title,
            homeOdds,
            awayDrawOdds,
            ...result
          });
        }
      }
    }
  }
  
  return opportunities;
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
    
    // Use sports we know are in-season (October 2025)
    const TARGET_SPORTS = [
      // American Football
      'americanfootball_nfl',
      
      // Basketball  
      'basketball_nba',
      'basketball_ncaab',
      'basketball_wnba',
      
      // Soccer/Football
      'soccer_epl',
      'soccer_spain_la_liga',
      'soccer_germany_bundesliga',
      'soccer_italy_serie_a', 
      'soccer_france_ligue_one',
      'soccer_uefa_champs_league',
      'soccer_uefa_europa_league',
      'soccer_netherlands_eredivisie',
      'soccer_portugal_primeira_liga',
      'soccer_turkey_super_league',
      'soccer_scotland_premiership',
      'soccer_mexico_ligamx',
      'soccer_brazil_campeonato',
      'soccer_argentina_primera_division',
      'soccer_japan_j_league',
      'soccer_australia_aleague',
      
      // Ice Hockey
      'icehockey_nhl',
      'icehockey_sweden_hockey_league',
      'icehockey_finland_sm_liiga',
      
      // Tennis (if active)
      'tennis_atp',
      'tennis_wta',
      
      // Rugby (if active)
      'rugbyleague_nrl',
      'rugby_world_cup',
      
      // MMA/Boxing
      'mma_mixed_martial_arts',
      'boxing_boxing'
    ];
    
    console.log(`Testing ${TARGET_SPORTS.length} in-season sports`);
    const MAX_EVENTS_PER_SPORT = 30;
    const TIME_BUDGET_MS = 18000;
    const startTime = Date.now();

    console.log('Starting multi-market odds collection...');

    // Clean old opportunities
    await supabase.from('arbitrage_opportunities').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    let allOpportunities: any[] = [];
    let totalProcessedEvents = 0;
    let totalMarketsProcessed = 0;

    for (const sportKey of TARGET_SPORTS) {
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        console.log(`Time budget exceeded, stopping at sport: ${sportKey}`);
        break;
      }

      try {
        console.log(`Fetching odds for sport: ${sportKey}`);
        // Fetch multiple markets in one API call
        const marketsParam = MARKET_TYPES.join(',');
        const url = `${BASE_URL}/sports/${sportKey}/odds/?regions=uk&markets=${marketsParam}&oddsFormat=decimal&apiKey=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.log(`Failed to fetch ${sportKey}: ${response.status}`);
          continue;
        }

        const oddsData = await response.json();
        
        // Skip if no events
        if (!oddsData || oddsData.length === 0) {
          console.log(`${sportKey}: No events returned from API`);
          continue;
        }
        
        // Include events starting within last 3 hours (live) and future events
        const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
        const relevantEvents = oddsData.filter((e: any) => 
          new Date(e.commence_time).getTime() > threeHoursAgo
        ).slice(0, MAX_EVENTS_PER_SPORT);
        
        if (relevantEvents.length === 0) {
          console.log(`${sportKey}: No upcoming or live events`);
          continue;
        }
        
        console.log(`${sportKey}: Processing ${relevantEvents.length} events (${oddsData.length} total from API)`);

        for (const event of relevantEvents) {
          if (Date.now() - startTime > TIME_BUDGET_MS) break;

          // Create/update event
          const eventKey = event.id || `${event.sport_key}_${event.home_team}_${event.away_team}`;
          const { data: eventData } = await supabase.from('events').upsert({ 
            event_key: eventKey, 
            sport_key: event.sport_key, 
            sport_title: event.sport_title, 
            commence_time: event.commence_time, 
            home_team: event.home_team, 
            away_team: event.away_team, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'event_key' }).select().single();
          
          if (!eventData) continue;
          totalProcessedEvents++;

          // Process each market type separately
          for (const bookmaker of event.bookmakers) {
            const { data: bookmakerData } = await supabase.from('bookmakers').upsert({ 
              key: bookmaker.key, 
              title: bookmaker.title, 
              updated_at: new Date().toISOString() 
            }, { onConflict: 'key' }).select().single();

            if (!bookmakerData) continue;

            // Store odds for each market
            for (const market of bookmaker.markets || []) {
              if (!MARKET_MAP[market.key]) continue;
              
              const marketLine = market.key === 'totals' || market.key === 'spreads' ? parseFloat(market.outcomes[0]?.point || '0') : null;
              
              await supabase.from('market_odds').insert({
                event_id: eventData.id,
                market_key: market.key,
                bookmaker_id: bookmakerData.id,
                outcomes: market.outcomes,
                market_line: marketLine,
                is_live: false,
                last_update: new Date().toISOString()
              });
            }
          }

          // Detect arbitrage for each market type
          for (const marketType of MARKET_TYPES) {
            if (Date.now() - startTime > TIME_BUDGET_MS) break;
            totalMarketsProcessed++;

            const { data: marketOdds } = await supabase
              .from('market_odds')
              .select('*, bookmakers(title)')
              .eq('event_id', eventData.id)
              .eq('market_key', marketType);

            if (!marketOdds || marketOdds.length < 2) continue;

            // Group by market line (important for totals/spreads)
            const lineGroups = new Map<string, any[]>();
            for (const odds of marketOdds) {
              const lineKey = odds.market_line ? odds.market_line.toString() : 'default';
              if (!lineGroups.has(lineKey)) lineGroups.set(lineKey, []);
              lineGroups.get(lineKey)!.push(odds);
            }

            // Check arbitrage for each line group
            for (const [line, oddsInGroup] of lineGroups) {
              if (oddsInGroup.length < 2) continue;

              const outcomeNames = new Set<string>();
              oddsInGroup.forEach(o => o.outcomes.forEach((out: any) => outcomeNames.add(out.name)));

              // Try all combinations of bookmakers covering all outcomes
              const numOutcomes = outcomeNames.size;
              if (numOutcomes < 2) continue;

              const outcomeArray = Array.from(outcomeNames);
              
              // For each combination of bookmakers (one per outcome)
              function* getCombinations(outcomes: string[], bookmakerOdds: any[]) {
                if (outcomes.length === 0) {
                  yield [];
                  return;
                }
                
                const [firstOutcome, ...restOutcomes] = outcomes;
                for (const odds of bookmakerOdds) {
                  const matchingOutcome = odds.outcomes.find((o: any) => o.name === firstOutcome);
                  if (matchingOutcome) {
                    if (restOutcomes.length === 0) {
                      yield [{ outcome: firstOutcome, odds: matchingOutcome.price, bookmaker: odds.bookmakers.title }];
                    } else {
                      for (const rest of getCombinations(restOutcomes, bookmakerOdds.filter((o: any) => o.id !== odds.id))) {
                        yield [{ outcome: firstOutcome, odds: matchingOutcome.price, bookmaker: odds.bookmakers.title }, ...rest];
                      }
                    }
                  }
                }
              }

              for (const combo of getCombinations(outcomeArray, oddsInGroup)) {
                if (combo.length !== numOutcomes) continue;

                const result = detectArbitrage(combo);
                if (result.isArb) {
                  const outcomes = combo.map(c => ({ name: c.outcome, odds: c.odds, bookmaker: c.bookmaker }));
                  
                  await supabase.from('arbitrage_opportunities').insert({
                    event_id: eventData.id,
                    outcomes,
                    profit_margin: result.profitMargin,
                    arb_percent: result.arbPercent,
                    market_key: marketType,
                    market_display_name: MARKET_MAP[marketType].displayName,
                    market_line: line !== 'default' ? parseFloat(line) : null,
                    is_cross_market: false,
                    is_live: false,
                    opportunity_type: 'pre-match'
                  });

                  allOpportunities.push({
                    id: eventData.id,
                    sport: event.sport_title,
                    teamA: event.home_team,
                    teamB: event.away_team,
                    startTime: event.commence_time,
                    outcomes,
                    profitMargin: result.profitMargin,
                    market: MARKET_MAP[marketType].displayName,
                    marketLine: line !== 'default' ? parseFloat(line) : null
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error for ${sportKey}:`, error);
      }
    }

    console.log(`Processed ${totalProcessedEvents} events, ${totalMarketsProcessed} markets, found ${allOpportunities.length} opportunities`);

    return new Response(JSON.stringify({ 
      success: true, 
      eventsProcessed: totalProcessedEvents, 
      marketsProcessed: totalMarketsProcessed,
      opportunitiesFound: allOpportunities.length, 
      opportunities: allOpportunities.slice(0, 20) // Limit response size
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
