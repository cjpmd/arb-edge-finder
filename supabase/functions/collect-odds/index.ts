
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

interface Odds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const API_KEY = '928365076820fc52c6d713adefbf0421';
    const BASE_URL = 'https://api.the-odds-api.com/v4';
    const TARGET_SPORTS = ['soccer_epl', 'americanfootball_nfl', 'basketball_nba'];

    console.log('Starting odds collection...');

    // Check request quota
    const { data: configData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'max_requests_month')
      .single();

    const maxRequests = parseInt(configData?.value || '500');
    
    // Get current month's request count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: requestLog } = await supabase
      .from('api_request_log')
      .select('request_count')
      .gte('timestamp', startOfMonth.toISOString());

    const totalRequests = requestLog?.reduce((sum, log) => sum + log.request_count, 0) || 0;

    if (totalRequests >= maxRequests) {
      console.log('Request quota exceeded for this month');
      return new Response(
        JSON.stringify({ error: 'Request quota exceeded' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    let allOpportunities = [];
    let totalProcessedEvents = 0;

    // Fetch odds for each sport
    for (const sportKey of TARGET_SPORTS) {
      try {
        console.log(`Fetching odds for ${sportKey}...`);
        
        const url = `${BASE_URL}/sports/${sportKey}/odds/?regions=us&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`HTTP error for ${sportKey}:`, response.status, response.statusText);
          continue;
        }
        
        const oddsData: Odds[] = await response.json();
        console.log(`Received ${oddsData.length} events for ${sportKey}`);
        
        // Log API request
        await supabase.from('api_request_log').insert({
          endpoint: `sports/${sportKey}/odds`,
          request_count: 1,
          remaining_quota: maxRequests - totalRequests - 1
        });

        // Process each event
        for (const event of oddsData) {
          try {
            const eventKey = event.id || `${event.sport_key}_${event.home_team}_${event.away_team}_${new Date(event.commence_time).getTime()}`;
            
            console.log(`Processing event: ${eventKey}`);

            // Upsert event
            const { data: eventData, error: eventError } = await supabase
              .from('events')
              .upsert({
                event_key: eventKey,
                sport_key: event.sport_key,
                sport_title: event.sport_title,
                commence_time: event.commence_time,
                home_team: event.home_team,
                away_team: event.away_team,
                updated_at: new Date().toISOString()
              }, { onConflict: 'event_key' })
              .select()
              .single();

            if (eventError) {
              console.error('Error upserting event:', eventError);
              continue;
            }

            if (!eventData) {
              console.error('No event data returned after upsert');
              continue;
            }

            totalProcessedEvents++;

            // Clear existing odds for this event
            await supabase
              .from('odds')
              .delete()
              .eq('event_id', eventData.id);

            // Process bookmakers and odds
            const eventBookmakers = [];
            for (const bookmaker of event.bookmakers) {
              // Upsert bookmaker
              const { error: bookmakerError } = await supabase
                .from('bookmakers')
                .upsert({
                  key: bookmaker.key,
                  title: bookmaker.title,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

              if (bookmakerError) {
                console.error('Error upserting bookmaker:', bookmakerError);
                continue;
              }

              // Get bookmaker ID
              const { data: bookmakerData } = await supabase
                .from('bookmakers')
                .select('id')
                .eq('key', bookmaker.key)
                .single();

              if (!bookmakerData) continue;

              // Process odds
              if (bookmaker.markets[0] && bookmaker.markets[0].outcomes.length >= 2) {
                const outcomes = bookmaker.markets[0].outcomes;
                
                // Store each outcome
                for (const outcome of outcomes) {
                  await supabase
                    .from('odds')
                    .insert({
                      event_id: eventData.id,
                      bookmaker_id: bookmakerData.id,
                      outcome_name: outcome.name,
                      outcome_price: outcome.price,
                      last_update: bookmaker.last_update
                    });
                }

                // Store bookmaker data for arbitrage calculation
                eventBookmakers.push({
                  key: bookmaker.key,
                  title: bookmaker.title,
                  id: bookmakerData.id,
                  outcomes: outcomes
                });
              }
            }

            // Clear existing arbitrage opportunities for this event
            await supabase
              .from('arbitrage_opportunities')
              .delete()
              .eq('event_id', eventData.id);

            // Find arbitrage opportunities for this event
            console.log(`Looking for arbitrage opportunities among ${eventBookmakers.length} bookmakers`);
            
            // Improved arbitrage detection logic
            for (let i = 0; i < eventBookmakers.length; i++) {
              for (let j = i + 1; j < eventBookmakers.length; j++) {
                const bookmakerA = eventBookmakers[i];
                const bookmakerB = eventBookmakers[j];
                
                console.log(`Checking arbitrage between ${bookmakerA.title} and ${bookmakerB.title}`);
                console.log(`BookmakerA outcomes:`, bookmakerA.outcomes);
                console.log(`BookmakerB outcomes:`, bookmakerB.outcomes);
                
                // Find best odds for each outcome across both bookmakers
                let bestOddsA = { odds: 0, bookmaker: null, team: '' };
                let bestOddsB = { odds: 0, bookmaker: null, team: '' };
                
                // Check all outcome combinations for potential arbitrage
                for (const outcomeA of bookmakerA.outcomes) {
                  for (const outcomeB of bookmakerB.outcomes) {
                    // Only consider different outcomes (opposing bets)
                    if (outcomeA.name !== outcomeB.name) {
                      const oddsA = outcomeA.price;
                      const oddsB = outcomeB.price;
                      
                      const impliedProbA = 1 / oddsA;
                      const impliedProbB = 1 / oddsB;
                      const totalImpliedProb = impliedProbA + impliedProbB;
                      
                      console.log(`Checking: ${outcomeA.name} @ ${oddsA} (${bookmakerA.title}) vs ${outcomeB.name} @ ${oddsB} (${bookmakerB.title}), total prob: ${totalImpliedProb}`);
                      
                      // Check for arbitrage opportunity (total implied probability < 1)
                      if (totalImpliedProb < 0.98) { // More realistic threshold - leaves room for practical arbitrage after fees
                        const profitMargin = ((1 / totalImpliedProb) - 1) * 100;
                        const arbPercent = totalImpliedProb * 100;
                        
                        console.log(`FOUND ARBITRAGE: ${profitMargin.toFixed(2)}% profit between ${bookmakerA.title} and ${bookmakerB.title}`);
                        
                        try {
                          const { error: arbError } = await supabase
                            .from('arbitrage_opportunities')
                            .insert({
                              event_id: eventData.id,
                              bookmaker_a_id: bookmakerA.id,
                              bookmaker_b_id: bookmakerB.id,
                              team_a_odds: oddsA,
                              team_b_odds: oddsB,
                              team_a_bookmaker: bookmakerA.title,
                              team_b_bookmaker: bookmakerB.title,
                              arb_percent: arbPercent,
                              profit_margin: profitMargin
                            });

                          if (!arbError) {
                            allOpportunities.push({
                              sport: event.sport_title,
                              teams: `${event.home_team} vs ${event.away_team}`,
                              profitMargin: profitMargin,
                              bookmakerA: bookmakerA.title,
                              bookmakerB: bookmakerB.title,
                              oddsA: oddsA,
                              oddsB: oddsB,
                              outcomeA: outcomeA.name,
                              outcomeB: outcomeB.name
                            });
                          } else {
                            console.error('Error saving arbitrage opportunity:', arbError);
                          }
                        } catch (insertError) {
                          console.error('Database insert error:', insertError);
                        }
                      }
                    }
                  }
                }
              }
            }

          } catch (eventProcessError) {
            console.error(`Error processing event ${event.id}:`, eventProcessError);
          }
        }

        console.log(`Processed ${oddsData.length} events for ${sportKey}`);
        
      } catch (error) {
        console.error(`Error processing ${sportKey}:`, error);
      }
    }

    console.log(`Total events processed: ${totalProcessedEvents}`);
    console.log(`Total arbitrage opportunities found: ${allOpportunities.length}`);

    // Log the found opportunities for debugging
    if (allOpportunities.length > 0) {
      console.log('Arbitrage opportunities:', allOpportunities);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        opportunitiesFound: allOpportunities.length,
        eventsProcessed: totalProcessedEvents,
        opportunities: allOpportunities 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in collect-odds function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
