// Shared types for arbitrage betting opportunities

export interface Outcome {
  name: string;
  odds: number;
  bookmaker: string;
}

export interface Opportunity {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  startTime: string;
  outcomes: Outcome[];
  arbPercent: number;
  profitMargin: number;
}
