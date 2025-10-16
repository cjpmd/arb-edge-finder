-- Add outcomes JSONB column to store dynamic arbitrage outcomes
ALTER TABLE arbitrage_opportunities 
ADD COLUMN IF NOT EXISTS outcomes jsonb;

-- Add index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_arbitrage_outcomes ON arbitrage_opportunities USING gin(outcomes);

-- Keep existing columns for backward compatibility during transition
COMMENT ON COLUMN arbitrage_opportunities.outcomes IS 'Dynamic array of outcomes with name, odds, and bookmaker for 2-way or 3-way arbitrage';