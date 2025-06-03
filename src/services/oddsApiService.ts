
interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

interface Odds {
  key: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

interface ArbitrageOpportunity {
  eventId: string;
  sport: string;
  teamA: string;
  teamB: string;
  startTime: string;
  bookmakerA: { name: string; odds: number; team: string };
  bookmakerB: { name: string; odds: number; team: string };
  arbPercent: number;
  profitMargin: number;
}

class OddsApiService {
  private apiKey = '928365076820fc52c6d713adefbf0421';
  private baseUrl = 'https://api.the-odds-api.com/v4';
  private targetSports = ['soccer_epl', 'basketball_nba', 'tennis_atp'];
  private maxRequestsPerMonth = 500;

  async fetchSports(): Promise<Sport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sports/?apiKey=${this.apiKey}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const sports = await response.json();
      await this.logApiRequest('sports', 1);
      
      return sports.filter((sport: Sport) => this.targetSports.includes(sport.key));
    } catch (error) {
      console.error('Error fetching sports:', error);
      throw error;
    }
  }

  async fetchOddsForSport(sportKey: string): Promise<Odds[]> {
    try {
      const url = `${this.baseUrl}/sports/${sportKey}/odds/?regions=uk,eu&markets=h2h&oddsFormat=decimal&apiKey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const odds = await response.json();
      await this.logApiRequest(`sports/${sportKey}/odds`, 1);
      
      return odds;
    } catch (error) {
      console.error(`Error fetching odds for ${sportKey}:`, error);
      throw error;
    }
  }

  calculateArbitrage(oddsA: number, oddsB: number): { arbPercent: number; profitMargin: number; isArbitrage: boolean } {
    const impliedProbA = 1 / oddsA;
    const impliedProbB = 1 / oddsB;
    const totalImpliedProb = impliedProbA + impliedProbB;
    
    const arbPercent = totalImpliedProb * 100;
    const profitMargin = ((1 / totalImpliedProb) - 1) * 100;
    const isArbitrage = totalImpliedProb < 1 && profitMargin > 1;
    
    return { arbPercent, profitMargin, isArbitrage };
  }

  calculateStakes(totalStake: number, oddsA: number, oddsB: number): { stakeA: number; stakeB: number } {
    const totalOdds = oddsA + oddsB;
    const stakeA = (totalStake * oddsB) / totalOdds;
    const stakeB = (totalStake * oddsA) / totalOdds;
    
    return { stakeA, stakeB };
  }

  findArbitrageOpportunities(oddsData: Odds[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const event of oddsData) {
      const bookmakers = event.bookmakers;
      
      // Compare all bookmaker pairs for this event
      for (let i = 0; i < bookmakers.length; i++) {
        for (let j = i + 1; j < bookmakers.length; j++) {
          const bookmakerA = bookmakers[i];
          const bookmakerB = bookmakers[j];
          
          if (bookmakerA.markets[0] && bookmakerB.markets[0]) {
            const marketA = bookmakerA.markets[0];
            const marketB = bookmakerB.markets[0];
            
            // Check all outcome combinations
            for (const outcomeA of marketA.outcomes) {
              for (const outcomeB of marketB.outcomes) {
                // Only consider opportunities where we bet on different teams
                if (outcomeA.name !== outcomeB.name) {
                  const { arbPercent, profitMargin, isArbitrage } = this.calculateArbitrage(
                    outcomeA.price,
                    outcomeB.price
                  );
                  
                  if (isArbitrage) {
                    opportunities.push({
                      eventId: event.key,
                      sport: event.sport_title,
                      teamA: event.home_team,
                      teamB: event.away_team,
                      startTime: event.commence_time,
                      bookmakerA: {
                        name: bookmakerA.title,
                        odds: outcomeA.price,
                        team: outcomeA.name
                      },
                      bookmakerB: {
                        name: bookmakerB.title,
                        odds: outcomeB.price,
                        team: outcomeB.name
                      },
                      arbPercent,
                      profitMargin
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    return opportunities;
  }

  async logApiRequest(endpoint: string, requestCount: number): Promise<void> {
    // This would integrate with your database to log API requests
    console.log(`API Request logged: ${endpoint} - ${requestCount} requests`);
  }

  async checkRequestQuota(): Promise<boolean> {
    // This would check your database for current month's request count
    // For now, return true to allow requests
    return true;
  }

  async runOddsCollection(): Promise<ArbitrageOpportunity[]> {
    console.log('Starting odds collection job...');
    
    // Check if we're within request quota
    const canMakeRequests = await this.checkRequestQuota();
    if (!canMakeRequests) {
      console.log('Request quota exceeded for this month');
      return [];
    }

    try {
      // Fetch available sports
      const sports = await this.fetchSports();
      console.log(`Found ${sports.length} target sports`);

      let allOpportunities: ArbitrageOpportunity[] = [];

      // Fetch odds for each sport
      for (const sport of sports) {
        try {
          console.log(`Fetching odds for ${sport.title}...`);
          const oddsData = await this.fetchOddsForSport(sport.key);
          
          // Find arbitrage opportunities
          const opportunities = this.findArbitrageOpportunities(oddsData);
          allOpportunities = [...allOpportunities, ...opportunities];
          
          console.log(`Found ${opportunities.length} arbitrage opportunities for ${sport.title}`);
        } catch (error) {
          console.error(`Error processing ${sport.title}:`, error);
        }
      }

      console.log(`Total arbitrage opportunities found: ${allOpportunities.length}`);
      return allOpportunities;
      
    } catch (error) {
      console.error('Error in odds collection job:', error);
      throw error;
    }
  }
}

export const oddsApiService = new OddsApiService();
