
import { useState, useEffect } from 'react';

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

  const loadData = () => {
    try {
      const stored = localStorage.getItem('arbitrage_opportunities');
      const lastUpdateStored = localStorage.getItem('last_update');
      
      if (stored) {
        const data = JSON.parse(stored);
        // Add unique IDs to each opportunity
        const dataWithIds = data.map((opp: any, index: number) => ({
          ...opp,
          id: `${opp.eventId}-${index}`
        }));
        setOpportunities(dataWithIds);
      }
      
      if (lastUpdateStored) {
        setLastUpdate(lastUpdateStored);
      }
    } catch (error) {
      console.error('Error loading arbitrage data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for storage changes (when new data is saved by the job)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'arbitrage_opportunities') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates every 30 seconds
    const interval = setInterval(loadData, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    // Import and run the job manually
    const { jobScheduler } = await import('../services/jobScheduler');
    await jobScheduler.runManually();
    loadData();
  };

  return {
    opportunities,
    loading,
    lastUpdate,
    refreshData
  };
};
