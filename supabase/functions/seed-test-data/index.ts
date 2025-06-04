
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Seeding test data...');

    // Create test bookmakers
    const testBookmakers = [
      { key: 'bet365', title: 'Bet365' },
      { key: 'betway', title: 'Betway' },
      { key: 'unibet', title: 'Unibet' }
    ];

    for (const bookmaker of testBookmakers) {
      await supabase
        .from('bookmakers')
        .upsert(bookmaker, { onConflict: 'key' });
    }

    // Create test event
    const testEvent = {
      event_key: 'test_event_1',
      sport_key: 'soccer_epl',
      sport_title: 'EPL',
      commence_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      home_team: 'Manchester City',
      away_team: 'Liverpool'
    };

    const { data: eventData } = await supabase
      .from('events')
      .upsert(testEvent, { onConflict: 'event_key' })
      .select()
      .single();

    if (!eventData) {
      throw new Error('Failed to create test event');
    }

    // Get bookmaker IDs
    const { data: bookmakerData } = await supabase
      .from('bookmakers')
      .select('id, key')
      .in('key', ['bet365', 'betway']);

    if (!bookmakerData || bookmakerData.length < 2) {
      throw new Error('Failed to get bookmaker data');
    }

    // Create arbitrage opportunity (2.1 vs 2.0 odds creates arbitrage)
    const arbOpportunity = {
      event_id: eventData.id,
      bookmaker_a_id: bookmakerData[0].id,
      bookmaker_b_id: bookmakerData[1].id,
      team_a_odds: 2.1,
      team_b_odds: 2.0,
      team_a_bookmaker: 'Bet365',
      team_b_bookmaker: 'Betway',
      arb_percent: 97.62, // (1/2.1 + 1/2.0) * 100
      profit_margin: 2.44 // ((1/(1/2.1 + 1/2.0)) - 1) * 100
    };

    await supabase
      .from('arbitrage_opportunities')
      .upsert(arbOpportunity);

    console.log('Test data seeded successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Test data seeded' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error seeding test data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
