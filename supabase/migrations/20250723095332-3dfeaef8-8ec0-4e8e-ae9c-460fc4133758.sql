
-- Add proper foreign key constraints for arbitrage_opportunities table
ALTER TABLE arbitrage_opportunities 
ADD CONSTRAINT fk_arbitrage_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE arbitrage_opportunities 
ADD CONSTRAINT fk_arbitrage_bookmaker_a 
FOREIGN KEY (bookmaker_a_id) REFERENCES bookmakers(id) ON DELETE CASCADE;

ALTER TABLE arbitrage_opportunities 
ADD CONSTRAINT fk_arbitrage_bookmaker_b 
FOREIGN KEY (bookmaker_b_id) REFERENCES bookmakers(id) ON DELETE CASCADE;

-- Add foreign key constraint for odds table
ALTER TABLE odds 
ADD CONSTRAINT fk_odds_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE odds 
ADD CONSTRAINT fk_odds_bookmaker 
FOREIGN KEY (bookmaker_id) REFERENCES bookmakers(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_event_id ON arbitrage_opportunities(event_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_profit_margin ON arbitrage_opportunities(profit_margin DESC);
CREATE INDEX IF NOT EXISTS idx_odds_event_id ON odds(event_id);
CREATE INDEX IF NOT EXISTS idx_odds_bookmaker_id ON odds(bookmaker_id);
CREATE INDEX IF NOT EXISTS idx_events_commence_time ON events(commence_time);

-- Add unique constraint to prevent duplicate arbitrage opportunities
ALTER TABLE arbitrage_opportunities 
ADD CONSTRAINT unique_arbitrage_opportunity 
UNIQUE (event_id, bookmaker_a_id, bookmaker_b_id, team_a_odds, team_b_odds);
