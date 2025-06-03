
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
  key: string;
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
    const TARGET_SPORTS = ['soccer_epl', 'basketball_nba', 'tennis_atp'];

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

    // Fetch odds for each sport
    for (const sportKey of TARGET_SPORTS) {
      try {
        console.log(`Fetching odds for ${sportKey}...`);
        
        const url = `${BASE_URL}/sports/${sportKey}/odds/?regions=uk,eu&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`HTTP error for ${sportKey}:`, response.status);
          continue;
        }
        
        const oddsData: Odds[] = await response.json();
        
        // Log API request
        await supabase.from('api_request_log').insert({
          endpoint: `sports/${sportKey}/odds`,
          request_count: 1,
          remaining_quota: maxRequests - totalRequests - 1
        });

        // Process each event
        for (const event of oddsData) {
          // Upsert event
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .upsert({
              event_key: event.key,
              sport_key: event.sport_key,
              sport_title: event.sport_title,
              commence_time: event.commence_time,
              home_team: event.home_team,
              away_team: event.away_team,
              updated_at: new Date().toISOString()
            }, { onConflict: 'event_key' })
            .select()
            .single();

          if (eventError || !eventData) {
            console.error('Error upserting event:', eventError);
            continue;
          }

          // Process bookmakers and odds
          for (const bookmaker of event.bookmakers) {
            // Upsert bookmaker
            await supabase
              .from('bookmakers')
              .upsert({
                key: bookmaker.key,
                title: bookmaker.title,
                updated_at: new Date().toISOString()
              }, { onConflict: 'key' });

            // Process odds
            if (bookmaker.markets[0]) {
              for (const outcome of bookmaker.markets[0].outcomes) {
                await supabase
                  .from('odds')
                  .upsert({
                    event_id: eventData.id,
                    bookmaker_id: (await supabase.from('bookmakers').select('id').eq('key', bookmaker.key).single()).data?.id,
                    outcome_name: outcome.name,
                    outcome_price: outcome.price,
                    last_update: bookmaker.last_update
                  }, { onConflict: 'event_id,bookmaker_id,outcome_name' });
              }
            }
          }

          // Find arbitrage opportunities for this event
          const bookmakers = event.bookmakers;
          
          for (let i = 0; i < bookmakers.length; i++) {
            for (let j = i + 1; j < bookmakers.length; j++) {
              const bookmakerA = bookmakers[i];
              const bookmakerB = bookmakers[j];
              
              if (bookmakerA.markets[0] && bookmakerB.markets[0]) {
                const marketA = bookmakerA.markets[0];
                const marketB = bookmakerB.markets[0];
                
                for (const outcomeA of marketA.outcomes) {
                  for (const outcomeB of marketB.outcomes) {
                    if (outcomeA.name !== outcomeB.name) {
                      const impliedProbA = 1 / outcomeA.price;
                      const impliedProbB = 1 / outcomeB.price;
                      const totalImpliedProb = impliedProbA + impliedProbB;
                      
                      const arbPercent = totalImpliedProb * 100;
                      const profitMargin = ((1 / totalImpliedProb) - 1) * 100;
                      
                      if (totalImpliedProb < 1 && profitMargin > 1) {
                        const bookmakerAData = await supabase.from('bookmakers').select('id').eq('key', bookmakerA.key).single();
                        const bookmakerBData = await supabase.from('bookmakers').select('id').eq('key', bookmakerB.key).single();

                        if (bookmakerAData.data && bookmakerBData.data) {
                          await supabase
                            .from('arbitrage_opportunities')
                            .upsert({
                              event_id: eventData.id,
                              bookmaker_a_id: bookmakerAData.data.id,
                              bookmaker_b_id: bookmakerBData.data.id,
                              team_a_odds: outcomeA.price,
                              team_b_odds: outcomeB.price,
                              team_a_bookmaker: bookmakerA.title,
                              team_b_bookmaker: bookmakerB.title,
                              arb_percent: arbPercent,
                              profit_margin: profitMargin,
                              updated_at: new Date().toISOString()
                            });

                          allOpportunities.push({
                            sport: event.sport_title,
                            teams: `${event.home_team} vs ${event.away_team}`,
                            profitMargin: profitMargin
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        console.log(`Processed ${oddsData.length} events for ${sportKey}`);
        
      } catch (error) {
        console.error(`Error processing ${sportKey}:`, error);
      }
    }

    console.log(`Total arbitrage opportunities found: ${allOpportunities.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        opportunitiesFound: allOpportunities.length,
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
