import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { Opportunity } from "@/types/arbitrage";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
  isSelected: boolean;
}

const OpportunityCard = ({ opportunity, onClick, isSelected }: OpportunityCardProps) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 5) return 'text-green-400';
    if (margin >= 3) return 'text-emerald-400';
    return 'text-blue-400';
  };

  const is3Way = opportunity.outcomes.length === 3;
  const marketDisplay = opportunity.marketLine 
    ? `${opportunity.market} ${opportunity.marketLine}` 
    : opportunity.market || 'Match Winner';

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected 
          ? 'bg-slate-700 border-blue-500 border-2' 
          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-slate-400 uppercase">
                {opportunity.sport}
              </span>
              <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-700 text-xs px-2 py-0">
                {marketDisplay}
              </Badge>
              {opportunity.isLive && (
                <Badge className="bg-red-900/50 text-red-300 border-red-700 text-xs px-2 py-0 animate-pulse">
                  LIVE
                </Badge>
              )}
              {opportunity.isCrossMarket && (
                <Badge variant="outline" className="bg-amber-900/30 text-amber-300 border-amber-700 text-xs px-2 py-0">
                  Cross-Market
                </Badge>
              )}
            </div>
            <div className="text-white font-semibold">
              {opportunity.teamA} vs {opportunity.teamB}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {formatTime(opportunity.startTime)}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getProfitColor(opportunity.profitMargin)}`}>
              +{opportunity.profitMargin.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-400">profit</div>
          </div>
        </div>

        {/* Dynamic Odds Display */}
        <div className={`grid gap-2 ${is3Way ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {opportunity.outcomes.map((outcome, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 rounded p-2"
            >
              <div className="text-xs text-slate-400 truncate">{outcome.bookmaker}</div>
              <div className="text-sm text-white font-medium truncate">{outcome.name}</div>
              <div className="text-xs text-blue-400">@ {outcome.odds.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <TrendingUp className="h-3 w-3" />
            <span>Arb: {opportunity.arbPercent.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunityCard;
