
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileText } from "lucide-react";
import { formatGBP } from "@/lib/utils";

interface Opportunity {
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

interface StakeCalculatorProps {
  opportunity: Opportunity;
  bankroll: number;
  onGenerateBetSlip: () => void;
}

const StakeCalculator = ({ opportunity, bankroll, onGenerateBetSlip }: StakeCalculatorProps) => {
  // Calculate optimal stakes using arbitrage formula
  const totalOdds = opportunity.bookmakerA.odds + opportunity.bookmakerB.odds;
  const stakeA = (bankroll * opportunity.bookmakerB.odds) / totalOdds;
  const stakeB = (bankroll * opportunity.bookmakerA.odds) / totalOdds;
  
  // Calculate potential returns
  const returnA = stakeA * opportunity.bookmakerA.odds;
  const returnB = stakeB * opportunity.bookmakerB.odds;
  const profit = Math.min(returnA, returnB) - bankroll;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Stake Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Selected Match</h4>
          <div className="text-sm text-slate-300">
            {opportunity.teamA} vs {opportunity.teamB}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {opportunity.sport} • Profit: +{opportunity.profitMargin.toFixed(2)}%
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-950 rounded-lg p-3 border border-blue-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium">{opportunity.bookmakerA.name}</div>
                <div className="text-sm text-slate-300">{opportunity.bookmakerA.team}</div>
                <div className="text-xs text-blue-400">@ {opportunity.bookmakerA.odds.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{formatGBP(stakeA)}</div>
                <div className="text-xs text-slate-400">stake</div>
              </div>
            </div>
          </div>

          <div className="bg-green-950 rounded-lg p-3 border border-green-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium">{opportunity.bookmakerB.name}</div>
                <div className="text-sm text-slate-300">{opportunity.bookmakerB.team}</div>
                <div className="text-xs text-green-400">@ {opportunity.bookmakerB.odds.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{formatGBP(stakeB)}</div>
                <div className="text-xs text-slate-400">stake</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-green-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-green-400 font-bold text-lg">{formatGBP(profit)}</div>
              <div className="text-xs text-slate-400">Guaranteed Profit</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold text-lg">{opportunity.profitMargin.toFixed(2)}%</div>
              <div className="text-xs text-slate-400">ROI</div>
            </div>
          </div>
        </div>

        <Button 
          onClick={onGenerateBetSlip}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Bet Slip
        </Button>
      </CardContent>
    </Card>
  );
};

export default StakeCalculator;
