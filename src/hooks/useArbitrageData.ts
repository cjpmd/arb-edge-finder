import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Opportunity, Outcome } from '@/types/arbitrage';

export const useArbitrageData = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('arbitrage_opportunities')
        .select(`
          *,
          events!arbitrage_opportunities_event_id_fkey (
            sport_title,
            home_team,
            away_team,
            commence_time
          )
        `)
        .order('profit_margin', { ascending: false });

      if (error) throw error;

      const formattedData: Opportunity[] = data.map((item) => {
        let outcomes: Outcome[];
        
        if (item.outcomes && Array.isArray(item.outcomes) && item.outcomes.length > 0) {
          outcomes = item.outcomes as unknown as Outcome[];
        } else {
          outcomes = [
            {
              name: (item.events as any)?.home_team || 'Team A',
              odds: item.team_a_odds,
              bookmaker: item.team_a_bookmaker,
            },
            {
              name: (item.events as any)?.away_team || 'Team B',
              odds: item.team_b_odds,
              bookmaker: item.team_b_bookmaker,
            },
          ];
        }

        return {
          id: item.id,
          sport: (item.events as any)?.sport_title || 'Unknown',
          teamA: (item.events as any)?.home_team || 'Team A',
          teamB: (item.events as any)?.away_team || 'Team B',
          startTime: (item.events as any)?.commence_time || new Date().toISOString(),
          outcomes,
          arbPercent: item.arb_percent,
          profitMargin: item.profit_margin,
          market: item.market_display_name || 'Match Winner',
          marketKey: item.market_key || 'h2h',
          marketLine: item.market_line,
          isCrossMarket: item.is_cross_market || false,
          isLive: item.is_live || false,
          opportunityType: (item.opportunity_type as 'pre-match' | 'live' | 'cross-market') || 'pre-match',
        };
      });

      setOpportunities(formattedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading arbitrage data:', error);
      toast.error('Failed to load arbitrage opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('arbitrage_opportunities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arbitrage_opportunities' }, () => loadData())
      .subscribe();

    const intervalId = setInterval(loadData, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  const refreshData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('collect-odds');
      if (error) throw error;
      toast.success(`Found ${data.opportunitiesFound || 0} new opportunities`);
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  return { opportunities, loading, lastUpdate, refreshData };
};
