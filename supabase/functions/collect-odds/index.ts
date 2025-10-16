import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const TARGET_SPORTS = ['soccer_epl', 'soccer_spain_la_liga', 'basketball_nba', 'americanfootball_nfl'];
    const MAX_EVENTS_PER_SPORT = 30;
    const TIME_BUDGET_MS = 18000;
    const startTime = Date.now();

    console.log('Starting odds collection...');

    await supabase.from('arbitrage_opportunities').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    let allOpportunities: any[] = [];
    let totalProcessedEvents = 0;

    for (const sportKey of TARGET_SPORTS) {
      if (Date.now() - startTime > TIME_BUDGET_MS) break;

      try {
        const url = `${BASE_URL}/sports/${sportKey}/odds/?regions=uk&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) continue;

        const oddsData = await response.json();
        const upcoming = oddsData.filter((e: any) => new Date(e.commence_time).getTime() > Date.now()).slice(0, MAX_EVENTS_PER_SPORT);

        for (const event of upcoming) {
          if (Date.now() - startTime > TIME_BUDGET_MS) break;

          const eventKey = event.id || `${event.sport_key}_${event.home_team}_${event.away_team}`;
          const { data: eventData } = await supabase.from('events').upsert({ event_key: eventKey, sport_key: event.sport_key, sport_title: event.sport_title, commence_time: event.commence_time, home_team: event.home_team, away_team: event.away_team, updated_at: new Date().toISOString() }, { onConflict: 'event_key' }).select().single();
          if (!eventData) continue;
          
          totalProcessedEvents++;
          const eventBookmakers: any[] = [];

          for (const bookmaker of event.bookmakers) {
            const { data: bookmakerData } = await supabase.from('bookmakers').upsert({ key: bookmaker.key, title: bookmaker.title, updated_at: new Date().toISOString() }, { onConflict: 'key' }).select().single();
            if (bookmakerData && bookmaker.markets?.[0]?.outcomes?.length >= 2) {
              eventBookmakers.push({ id: bookmakerData.id, title: bookmaker.title, outcomes: bookmaker.markets[0].outcomes });
            }
          }

          const twoWay = eventBookmakers.filter(b => b.outcomes.length === 2);
          const threeWay = eventBookmakers.filter(b => b.outcomes.length === 3);

          // 2-way arbitrage
          for (let i = 0; i < twoWay.length; i++) {
            for (let j = i + 1; j < twoWay.length; j++) {
              for (const outcomeA of twoWay[i].outcomes) {
                for (const outcomeB of twoWay[j].outcomes) {
                  if (outcomeA.name !== outcomeB.name) {
                    const totalInv = 1 / outcomeA.price + 1 / outcomeB.price;
                    if (totalInv < 0.99) {
                      const profitMargin = (1 / totalInv - 1) * 100;
                      const outcomes = [{ name: outcomeA.name, odds: outcomeA.price, bookmaker: twoWay[i].title }, { name: outcomeB.name, odds: outcomeB.price, bookmaker: twoWay[j].title }];
                      await supabase.from('arbitrage_opportunities').insert({ event_id: eventData.id, outcomes, profit_margin: profitMargin, arb_percent: totalInv * 100 });
                      allOpportunities.push({ id: eventData.id, sport: event.sport_title, teamA: event.home_team, teamB: event.away_team, startTime: event.commence_time, outcomes, profitMargin });
                    }
                  }
                }
              }
            }
          }

          // 3-way arbitrage
          for (let i = 0; i < threeWay.length; i++) {
            for (let j = 0; j < threeWay.length; j++) {
              for (let k = 0; k < threeWay.length; k++) {
                if (i !== j && i !== k && j !== k) {
                  const totalInv = 1 / threeWay[i].outcomes[0].price + 1 / threeWay[j].outcomes[1].price + 1 / threeWay[k].outcomes[2].price;
                  if (totalInv < 0.99) {
                    const profitMargin = (1 / totalInv - 1) * 100;
                    const outcomes = [{ name: threeWay[i].outcomes[0].name, odds: threeWay[i].outcomes[0].price, bookmaker: threeWay[i].title }, { name: threeWay[j].outcomes[1].name, odds: threeWay[j].outcomes[1].price, bookmaker: threeWay[j].title }, { name: threeWay[k].outcomes[2].name, odds: threeWay[k].outcomes[2].price, bookmaker: threeWay[k].title }];
                    await supabase.from('arbitrage_opportunities').insert({ event_id: eventData.id, outcomes, profit_margin: profitMargin, arb_percent: totalInv * 100 });
                    allOpportunities.push({ id: eventData.id, sport: event.sport_title, teamA: event.home_team, teamB: event.away_team, startTime: event.commence_time, outcomes, profitMargin });
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error for ${sportKey}:`, error);
      }
    }

    return new Response(JSON.stringify({ success: true, eventsProcessed: totalProcessedEvents, opportunitiesFound: allOpportunities.length, opportunities: allOpportunities }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
