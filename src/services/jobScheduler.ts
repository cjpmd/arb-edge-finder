
import { oddsApiService } from './oddsApiService';

class JobScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // 90 minutes in milliseconds
  private readonly INTERVAL_MS = 90 * 60 * 1000;

  start(): void {
    if (this.isRunning) {
      console.log('Job scheduler is already running');
      return;
    }

    console.log('Starting odds collection job scheduler (every 90 minutes)');
    
    // Run immediately on start
    this.runJob();
    
    // Then run every 90 minutes
    this.intervalId = setInterval(() => {
      this.runJob();
    }, this.INTERVAL_MS);
    
    this.isRunning = true;
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Job scheduler stopped');
  }

  private async runJob(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running odds collection job...`);
      const opportunities = await oddsApiService.runOddsCollection();
      console.log(`[${new Date().toISOString()}] Job completed. Found ${opportunities.length} opportunities`);
      
      // Here you would save the opportunities to your database
      // For now, we'll just store them in memory or localStorage for demo
      if (typeof window !== 'undefined') {
        localStorage.setItem('arbitrage_opportunities', JSON.stringify(opportunities));
        localStorage.setItem('last_update', new Date().toISOString());
      }
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Job failed:`, error);
    }
  }

  isJobRunning(): boolean {
    return this.isRunning;
  }

  // Method to manually trigger the job
  async runManually(): Promise<void> {
    console.log('Manually triggering odds collection job...');
    await this.runJob();
  }
}

export const jobScheduler = new JobScheduler();
