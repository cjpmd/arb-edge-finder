
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, Search, Filter, TrendingUp, Calculator } from "lucide-react";
import OpportunityCard from "@/components/OpportunityCard";
import StakeCalculator from "@/components/StakeCalculator";
import BetSlip from "@/components/BetSlip";

// Mock data for arbitrage opportunities
const mockOpportunities = [
  {
    id: "1",
    sport: "Football",
    teamA: "Manchester City",
    teamB: "Liverpool",
    startTime: "2024-06-04T15:00:00Z",
    bookmakerA: { name: "Bet365", odds: 2.10, team: "Manchester City" },
    bookmakerB: { name: "Betfair", odds: 2.05, team: "Liverpool" },
    arbPercent: 95.24,
    profitMargin: 4.76
  },
  {
    id: "2",
    sport: "Basketball",
    teamA: "Lakers",
    teamB: "Warriors",
    startTime: "2024-06-04T20:00:00Z",
    bookmakerA: { name: "William Hill", odds: 1.95, team: "Lakers" },
    bookmakerB: { name: "Pinnacle", odds: 2.15, team: "Warriors" },
    arbPercent: 97.98,
    profitMargin: 2.02
  },
  {
    id: "3",
    sport: "Tennis",
    teamA: "Djokovic",
    teamB: "Nadal",
    startTime: "2024-06-05T14:00:00Z",
    bookmakerA: { name: "Betfair", odds: 2.25, team: "Djokovic" },
    bookmakerB: { name: "Bet365", odds: 1.85, team: "Nadal" },
    arbPercent: 98.46,
    profitMargin: 1.54
  },
  {
    id: "4",
    sport: "Football",
    teamA: "Barcelona",
    teamB: "Real Madrid",
    startTime: "2024-06-05T18:00:00Z",
    bookmakerA: { name: "Pinnacle", odds: 2.40, team: "Barcelona" },
    bookmakerB: { name: "William Hill", odds: 1.75, team: "Real Madrid" },
    arbPercent: 98.81,
    profitMargin: 1.19
  },
  {
    id: "5",
    sport: "Basketball",
    teamA: "Celtics",
    teamB: "Heat",
    startTime: "2024-06-06T01:00:00Z",
    bookmakerA: { name: "Bet365", odds: 1.90, team: "Celtics" },
    bookmakerB: { name: "Betfair", odds: 2.20, team: "Heat" },
    arbPercent: 98.02,
    profitMargin: 1.98
  }
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [minProfit, setMinProfit] = useState(0);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [bankroll, setBankroll] = useState(1000);
  const [showBetSlip, setShowBetSlip] = useState(false);

  const filteredOpportunities = useMemo(() => {
    return mockOpportunities.filter(opp => {
      const matchesSearch = opp.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           opp.teamB.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = sportFilter === "all" || opp.sport.toLowerCase() === sportFilter.toLowerCase();
      const matchesProfit = opp.profitMargin >= minProfit;
      
      return matchesSearch && matchesSport && matchesProfit;
    });
  }, [searchTerm, sportFilter, minProfit]);

  const totalOpportunities = filteredOpportunities.length;
  const avgProfit = totalOpportunities > 0 
    ? (filteredOpportunities.reduce((sum, opp) => sum + opp.profitMargin, 0) / totalOpportunities).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-bold text-white">ArbEdge</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Bankroll: ${bankroll.toLocaleString()}</span>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Account
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-300 text-sm font-medium">Active Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{totalOpportunities}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-300 text-sm font-medium">Average Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{avgProfit}%</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-300 text-sm font-medium">Best Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {totalOpportunities > 0 ? Math.max(...filteredOpportunities.map(o => o.profitMargin)).toFixed(2) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-300 text-sm font-medium">Potential Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">
                ${totalOpportunities > 0 ? ((bankroll * Math.max(...filteredOpportunities.map(o => o.profitMargin))) / 100).toFixed(0) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min profit %"
                value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />

              <Input
                type="number"
                placeholder="Bankroll"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Opportunities List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Arbitrage Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      onClick={() => setSelectedOpportunity(opportunity)}
                      isSelected={selectedOpportunity?.id === opportunity.id}
                    />
                  ))}
                  {filteredOpportunities.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      No opportunities found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculator & Bet Slip */}
          <div className="space-y-6">
            {selectedOpportunity && (
              <StakeCalculator
                opportunity={selectedOpportunity}
                bankroll={bankroll}
                onGenerateBetSlip={() => setShowBetSlip(true)}
              />
            )}

            {showBetSlip && selectedOpportunity && (
              <BetSlip
                opportunity={selectedOpportunity}
                bankroll={bankroll}
                onClose={() => setShowBetSlip(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
