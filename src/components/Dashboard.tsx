
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Target, Clock, TrendingUp, Calculator } from "lucide-react";
import OpportunityCard from "./OpportunityCard";
import StakeCalculator from "./StakeCalculator";
import BetSlip from "./BetSlip";
import { useArbitrageData } from "@/hooks/useArbitrageData";
import { jobScheduler } from "@/services/jobScheduler";

const Dashboard = () => {
  const { opportunities, loading, lastUpdate, refreshData } = useArbitrageData();
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [bankroll, setBankroll] = useState(1000);
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [minProfit, setMinProfit] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobStatus, setJobStatus] = useState(false);

  // Start the job scheduler when component mounts
  useEffect(() => {
    jobScheduler.start();
    setJobStatus(jobScheduler.isJobRunning());
    
    return () => {
      // Don't stop the job when component unmounts, let it run in background
    };
  }, []);

  // Filter opportunities based on search and filters
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = searchTerm === "" || 
      opp.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.teamB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.sport.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSport = selectedSport === "all" || opp.sport === selectedSport;
    const matchesProfit = opp.profitMargin >= minProfit;
    
    return matchesSearch && matchesSport && matchesProfit;
  });

  // Get unique sports for filter
  const availableSports = Array.from(new Set(opportunities.map(opp => opp.sport)));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-bold text-white">ArbEdge</h1>
            <Badge variant={jobStatus ? "default" : "secondary"} className="ml-4">
              {jobStatus ? "Auto-updating" : "Manual mode"}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <div className="text-sm text-slate-400">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Opportunities</p>
                  <p className="text-2xl font-bold text-white">{opportunities.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Profit</p>
                  <p className="text-2xl font-bold text-green-400">
                    {opportunities.length > 0 
                      ? (opportunities.reduce((acc, opp) => acc + opp.profitMargin, 0) / opportunities.length).toFixed(2)
                      : "0.00"
                    }%
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Sports Covered</p>
                  <p className="text-2xl font-bold text-white">{availableSports.length}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Your Bankroll</p>
                  <Input
                    type="number"
                    value={bankroll}
                    onChange={(e) => setBankroll(Number(e.target.value))}
                    className="text-lg font-bold bg-transparent border-none p-0 text-white"
                    placeholder="1000"
                  />
                </div>
                <span className="text-yellow-400 text-lg font-bold">$</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search teams or sports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {availableSports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Min Profit %</label>
                <Input
                  type="number"
                  value={minProfit}
                  onChange={(e) => setMinProfit(Number(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSport("all");
                    setMinProfit(0);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Opportunities List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Arbitrage Opportunities ({filteredOpportunities.length})
              </h2>
              
              {filteredOpportunities.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No opportunities found</h3>
                    <p className="text-slate-400">
                      {opportunities.length === 0 
                        ? "Click 'Refresh' to fetch new arbitrage opportunities from our database."
                        : "Try adjusting your filters to see more opportunities."
                      }
                    </p>
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

            {/* Stake Calculator */}
            <div className="space-y-6">
              {selectedOpportunity ? (
                <StakeCalculator
                  opportunity={selectedOpportunity}
                  bankroll={bankroll}
                  onGenerateBetSlip={handleGenerateBetSlip}
                />
              ) : (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <Calculator className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Select an Opportunity</h3>
                    <p className="text-slate-400">
                      Click on any arbitrage opportunity to calculate your optimal stakes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

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
