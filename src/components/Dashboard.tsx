import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Calculator, DollarSign, Activity, Filter, Database } from "lucide-react";
import OpportunityCard from "./OpportunityCard";
import StakeCalculator from "./StakeCalculator";
import BetSlip from "./BetSlip";
import AdvancedSettings from "./AdvancedSettings";
import { useArbitrageData } from "@/hooks/useArbitrageData";
import { jobScheduler } from "@/services/jobScheduler";
import { supabase } from "@/integrations/supabase/client";
import type { Opportunity } from "@/types/arbitrage";

const Dashboard = () => {
  const { opportunities, loading, lastUpdate, refreshData } = useArbitrageData();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [bankroll, setBankroll] = useState(1000);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [minProfit, setMinProfit] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobStatus, setJobStatus] = useState<'running' | 'idle'>('idle');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => {
    const future = new Date();
    future.setDate(future.getDate() + 30); // Changed to 30 days
    return future.toISOString().split('T')[0];
  });
  const [profitThresholds, setProfitThresholds] = useState({
    preMatch: 0.985,
    live: 0.990,
    crossMarket: 0.995,
  });
  const [regions, setRegions] = useState(['uk', 'eu']);
  const [marketTypes, setMarketTypes] = useState(['h2h', 'spreads', 'totals']);
  const [maxEventsPerSport, setMaxEventsPerSport] = useState(30);
  const [maxSports, setMaxSports] = useState(30);
  const [scanResults, setScanResults] = useState<any>(null);

  useEffect(() => {
    jobScheduler.start();
    setJobStatus(jobScheduler.isJobRunning() ? 'running' : 'idle');
    
    return () => {
      // Keep job running in background
    };
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = searchTerm === "" || 
      opp.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.teamB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.sport.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSport = selectedSport === "all" || opp.sport === selectedSport;
    const matchesProfit = opp.profitMargin >= minProfit;
    
    return matchesSearch && matchesSport && matchesProfit;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('collect-odds', {
        body: { 
          dateFrom, 
          dateTo,
          profitThresholds,
          regions,
          marketTypes,
          maxEventsPerSport,
          maxSports
        }
      });
      if (error) {
        console.error('Error collecting odds:', error);
      } else {
        console.log('Odds collected:', data);
        setScanResults(data);
        await refreshData();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSeedTestData = async () => {
    try {
      console.log('Seeding test data...');
      const { data, error } = await supabase.functions.invoke('seed-test-data');
      if (error) {
        console.error('Error seeding test data:', error);
      } else {
        console.log('Test data seeded successfully:', data);
        await refreshData();
      }
    } catch (error) {
      console.error('Error calling seed-test-data function:', error);
    }
  };

  const handleCollectLiveOdds = async () => {
    setIsRefreshing(true);
    try {
      console.log('Collecting live odds...');
      const { data, error } = await supabase.functions.invoke('collect-live-odds', {
        body: { 
          dateFrom, 
          dateTo,
          profitThresholds,
          regions,
          marketTypes,
          maxEventsPerSport: 10,
          maxSports: 10
        }
      });
      if (error) {
        console.error('Error collecting live odds:', error);
      } else {
        console.log('Live odds collected:', data);
        setScanResults(data);
        await refreshData();
      }
    } catch (error) {
      console.error('Error calling collect-live-odds function:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateBetSlip = () => {
    if (selectedOpportunity) {
      setShowBetSlip(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Arbitrage Betting Dashboard</h1>
              <p className="text-slate-400 mt-1">
                {jobStatus === 'running' ? (
                  <span className="text-yellow-400">⚡ Collection in progress...</span>
                ) : (
                  <span className="text-green-400">✓ System active</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Pre-Match'}
              </Button>
              <Button
                onClick={handleCollectLiveOdds}
                disabled={isRefreshing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Activity className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Collecting...' : 'Collect Live'}
              </Button>
              <Button
                onClick={handleSeedTestData}
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              >
                <Database className="h-4 w-4 mr-2" />
                Seed Test Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {/* Fixed Stats and Filters Container */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Opportunities</p>
                  <p className="text-3xl font-bold text-white mt-1">{filteredOpportunities.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Profit Margin</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {filteredOpportunities.length > 0
                      ? (filteredOpportunities.reduce((sum, o) => sum + o.profitMargin, 0) / filteredOpportunities.length).toFixed(2)
                      : '0.00'}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Sports Covered</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {new Set(filteredOpportunities.map(o => o.sport)).size}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <label className="text-slate-400 text-sm block mb-2">Your Bankroll (£)</label>
                <Input
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(Number(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white text-xl font-bold"
                  placeholder="1000"
                />
              </CardContent>
            </Card>
          </div>

          {/* Advanced Settings */}
          <AdvancedSettings
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            profitThresholds={profitThresholds}
            onProfitThresholdsChange={setProfitThresholds}
            regions={regions}
            onRegionsChange={setRegions}
            marketTypes={marketTypes}
            onMarketTypesChange={setMarketTypes}
            maxEventsPerSport={maxEventsPerSport}
            onMaxEventsPerSportChange={setMaxEventsPerSport}
            maxSports={maxSports}
            onMaxSportsChange={setMaxSports}
          />

          {/* Filters */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Display Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Search Teams</label>
                  <Input
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-sm block mb-2">Sport</label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All Sports" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white z-50">
                      <SelectItem value="all" className="text-white hover:bg-slate-600">All Sports</SelectItem>
                      {Array.from(new Set(opportunities.map(o => o.sport)))
                        .filter(Boolean)
                        .map(sport => (
                          <SelectItem key={sport} value={sport} className="text-white hover:bg-slate-600">
                            {sport.replace(/_/g, ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-slate-400 text-sm block mb-2">Min Profit %</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minProfit}
                    onChange={(e) => setMinProfit(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    step="0.1"
                  />
                </div>

                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSport('all');
                    setMinProfit(0);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Scan Results Summary */}
          {scanResults && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="text-sm text-slate-300">
                  <div className="font-semibold mb-2">Last Scan Results:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-400">Events: </span>
                      <span className="text-white">{scanResults.eventsProcessed || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Markets: </span>
                      <span className="text-white">{scanResults.marketsProcessed || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Opportunities: </span>
                      <span className="text-green-400">{scanResults.opportunitiesFound || 0}</span>
                    </div>
                    {scanResults.closestArbitrage && (
                      <div>
                        <span className="text-slate-400">Closest: </span>
                        <span className="text-yellow-400">{scanResults.closestArbitrage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="container mx-auto px-4 pb-6 flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Scrollable Opportunities List */}
            <div className="lg:col-span-2 overflow-y-auto max-h-[calc(100vh-420px)] space-y-4 pr-2">
              <h2 className="text-2xl font-bold text-white sticky top-0 bg-slate-900 py-3 z-10">
                Arbitrage Opportunities
              </h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-400 text-lg">No arbitrage opportunities found</p>
                    <p className="text-slate-500 text-sm mt-2">Try adjusting your filters or refresh the data</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onClick={() => setSelectedOpportunity(opportunity)}
                    isSelected={selectedOpportunity?.id === opportunity.id}
                  />
                ))
              )}
            </div>

            {/* Scrollable Stake Calculator */}
            <div className="overflow-y-auto max-h-[calc(100vh-420px)]">
              <div className="sticky top-0 bg-slate-900 py-3 z-10">
                <h2 className="text-2xl font-bold text-white">Stake Calculator</h2>
              </div>
              {selectedOpportunity ? (
                <StakeCalculator
                  opportunity={selectedOpportunity}
                  bankroll={bankroll}
                  onGenerateBetSlip={handleGenerateBetSlip}
                />
              ) : (
                <Card className="bg-slate-800 border-slate-700 mt-4">
                  <CardContent className="p-12 text-center">
                    <Calculator className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Select an opportunity to calculate stakes</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bet Slip Modal */}
      {showBetSlip && selectedOpportunity && (
        <BetSlip
          opportunity={selectedOpportunity}
          bankroll={bankroll}
          onClose={() => setShowBetSlip(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
