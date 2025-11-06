import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileText } from "lucide-react";
import { formatGBP } from "@/lib/utils";
import type { Opportunity } from "@/types/arbitrage";

interface StakeCalculatorProps {
  opportunity: Opportunity;
  bankroll: number;
  onGenerateBetSlip: () => void;
}

const StakeCalculator = ({ opportunity, bankroll, onGenerateBetSlip }: StakeCalculatorProps) => {
  const outcomes = opportunity.outcomes;

  // Correct arbitrage formula: inverse odds weighting
  const totalInverse = outcomes.reduce((sum, o) => sum + 1 / o.odds, 0);
  const stakes = outcomes.map(o => (bankroll / o.odds) / totalInverse);
  
  // Calculate returns for each outcome
  const returns = stakes.map((stake, i) => stake * outcomes[i].odds);
  const guaranteedReturn = Math.min(...returns);
  const profit = guaranteedReturn - bankroll;
  const roi = (profit / bankroll) * 100;

  // Color schemes for different outcomes
  const colorSchemes = [
    "bg-blue-950 border-blue-800",
    "bg-green-950 border-green-800",
    "bg-purple-950 border-purple-800",
  ];

  const accentColors = [
    "text-blue-400",
    "text-green-400",
    "text-purple-400",
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Stake Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Info */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Selected Match</h4>
          <div className="text-sm text-slate-300">
            {opportunity.teamA} vs {opportunity.teamB}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {opportunity.sport} • Profit: +{roi.toFixed(2)}%
          </div>
        </div>

        {/* Dynamic Outcome Stakes */}
        <div className="space-y-3">
          {outcomes.map((outcome, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-3 border ${colorSchemes[idx] || "bg-slate-950 border-slate-800"}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{outcome.bookmaker}</div>
                  <div className="text-sm text-slate-300">{outcome.name}</div>
                  <div className={`text-xs ${accentColors[idx] || "text-slate-400"}`}>
                    @ {outcome.odds.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">£{stakes[idx].toFixed(2)}</div>
                  <div className="text-xs text-slate-400">stake</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Profit Summary */}
        <div className="bg-slate-900 rounded-lg p-4 border border-green-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-green-400 font-bold text-lg">£{profit.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Guaranteed Profit</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold text-lg">{roi.toFixed(2)}%</div>
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
