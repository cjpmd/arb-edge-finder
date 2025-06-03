
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";

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

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
  isSelected: boolean;
}

const OpportunityCard = ({ opportunity, onClick, isSelected }: OpportunityCardProps) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  const getProfitColor = (profit: number) => {
    if (profit >= 3) return "text-green-400";
    if (profit >= 2) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-slate-700 border-green-500 shadow-lg' 
          : 'bg-slate-750 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {opportunity.sport}
              </Badge>
              <div className="flex items-center text-slate-400 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(opportunity.startTime)}
              </div>
            </div>
            <h3 className="text-white font-semibold">
              {opportunity.teamA} vs {opportunity.teamB}
            </h3>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getProfitColor(opportunity.profitMargin)}`}>
              +{opportunity.profitMargin.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-400">profit</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">{opportunity.bookmakerA.name}</div>
            <div className="text-white font-medium">{opportunity.bookmakerA.team}</div>
            <div className="text-blue-400 font-bold">{opportunity.bookmakerA.odds.toFixed(2)}</div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">{opportunity.bookmakerB.name}</div>
            <div className="text-white font-medium">{opportunity.bookmakerB.team}</div>
            <div className="text-blue-400 font-bold">{opportunity.bookmakerB.odds.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-3 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Arb%: {opportunity.arbPercent.toFixed(2)}%
          </span>
          <div className="flex items-center text-green-400">
            <TrendingUp className="h-3 w-3 mr-1" />
            Guaranteed Profit
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunityCard;
