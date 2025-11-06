import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import { formatGBP } from "@/lib/utils";
import type { Opportunity } from "@/types/arbitrage";

interface BetSlipProps {
  opportunity: Opportunity;
  bankroll: number;
  onClose: () => void;
}

const BetSlip = ({ opportunity, bankroll, onClose }: BetSlipProps) => {
  // Correct arbitrage formula: inverse odds weighting
  const totalInverse = opportunity.outcomes.reduce((sum, o) => sum + 1 / o.odds, 0);
  const stakes = opportunity.outcomes.map(o => (bankroll / o.odds) / totalInverse);
  
  const returns = stakes.map((stake, i) => stake * opportunity.outcomes[i].odds);
  const guaranteedReturn = Math.min(...returns);
  const profit = guaranteedReturn - bankroll;
  const profitMargin = (profit / bankroll) * 100;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Bet slip copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const betSlipText = `
🎯 ARBITRAGE BET SLIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 EVENT DETAILS
Sport: ${opportunity.sport}
Match: ${opportunity.teamA} vs ${opportunity.teamB}
Time: ${formatTime(opportunity.startTime)}

💰 BETTING INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${opportunity.outcomes.map((outcome, idx) => `
BET ${idx + 1}:
Bookmaker: ${outcome.bookmaker}
Selection: ${outcome.name}
Odds: ${outcome.odds.toFixed(2)}
Stake: ${formatGBP(stakes[idx])}
Expected Return: ${formatGBP(returns[idx])}
`).join('\n')}

📈 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Investment: £${bankroll.toFixed(2)}
Guaranteed Profit: £${profit.toFixed(2)}
ROI: ${profitMargin.toFixed(2)}%

⚠️ IMPORTANT NOTES:
• Place all bets simultaneously to lock in odds
• Check minimum/maximum bet limits at each bookmaker
• Ensure sufficient balance across all accounts
• Odds may change - act quickly!

Generated: ${new Date().toLocaleString('en-GB')}
  `.trim();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Bet Slip - Arbitrage Opportunity</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Event Info */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">EVENT DETAILS</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Sport:</span>
                <span className="text-white">{opportunity.sport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Match:</span>
                <span className="text-white">{opportunity.teamA} vs {opportunity.teamB}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="text-white">{formatTime(opportunity.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profit Margin:</span>
                <span className="text-green-400 font-semibold">+{profitMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Betting Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400">BETTING INSTRUCTIONS</h3>
            {opportunity.outcomes.map((outcome, idx) => (
              <div key={idx} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Bet {idx + 1}</div>
                    <div className="text-lg font-semibold text-white">{outcome.bookmaker}</div>
                    <div className="text-sm text-blue-400">{outcome.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Odds</div>
                    <div className="text-lg font-bold text-white">{outcome.odds.toFixed(2)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-slate-400">Stake</div>
                    <div className="text-base font-semibold text-green-400">£{stakes[idx].toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Expected Return</div>
                    <div className="text-base font-semibold text-white">£{returns[idx].toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-slate-900 rounded-lg p-4 border-2 border-green-600">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">SUMMARY</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-400 mb-1">Total Investment</div>
                <div className="text-lg font-bold text-white">£{bankroll.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Guaranteed Profit</div>
                <div className="text-lg font-bold text-green-400">£{profit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">ROI</div>
                <div className="text-lg font-bold text-blue-400">{profitMargin.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(betSlipText)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Bet Slip
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BetSlip;
