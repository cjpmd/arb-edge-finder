
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ArbitrageOpportunity {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  startTime: string;
  bookmakerA: { name: string; odds: number; team: string };
  bookmakerB: { name: string; odds: number; team: string };
  arbPercent: number;
  profitMargin: number;
}

export const useArbitrageData = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch arbitrage opportunities with related event data
      const { data: arbData, error } = await supabase
        .from('arbitrage_opportunities')
        .select(`
          id,
          arb_percent,
          profit_margin,
          team_a_odds,
          team_b_odds,
          team_a_bookmaker,
          team_b_bookmaker,
          created_at,
          events (
            event_key,
            sport_title,
            home_team,
            away_team,
            commence_time
          )
        `)
        .order('profit_margin', { ascending: false });

      if (error) {
        console.error('Error fetching arbitrage opportunities:', error);
        return;
      }

      // Transform the data to match the expected format
      const transformedData: ArbitrageOpportunity[] = (arbData || []).map((opp) => ({
        id: opp.id,
        sport: opp.events?.sport_title || 'Unknown',
        teamA: opp.events?.home_team || 'Team A',
        teamB: opp.events?.away_team || 'Team B',
        startTime: opp.events?.commence_time || new Date().toISOString(),
        bookmakerA: {
          name: opp.team_a_bookmaker,
          odds: Number(opp.team_a_odds),
          team: opp.events?.home_team || 'Team A'
        },
        bookmakerB: {
          name: opp.team_b_bookmaker,
          odds: Number(opp.team_b_odds),
          team: opp.events?.away_team || 'Team B'
        },
        arbPercent: Number(opp.arb_percent),
        profitMargin: Number(opp.profit_margin)
      }));

      const liveData = transformedData.filter((opp) => new Date(opp.startTime).getTime() > Date.now());
      setOpportunities(liveData);

      // Set last update time
      setLastUpdate(new Date().toISOString());

    } catch (error) {
      console.error('Error loading arbitrage data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscription for new opportunities
    const channel = supabase
      .channel('arbitrage-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arbitrage_opportunities'
        },
        () => {
          console.log('New arbitrage opportunities detected, refreshing data...');
          loadData();
        }
      )
      .subscribe();

    // Also check for updates every 2 minutes
    const interval = setInterval(loadData, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const refreshData = async () => {
    await loadData();
    
    // Trigger the Edge Function to collect new odds
    try {
      const { data, error } = await supabase.functions.invoke('collect-odds');
      if (error) {
        console.error('Error triggering odds collection:', error);
      } else {
        console.log('Odds collection triggered successfully:', data);
      }
    } catch (error) {
      console.error('Error calling collect-odds function:', error);
    }
  };

  return {
    opportunities,
    loading,
    lastUpdate,
    refreshData
  };
};
