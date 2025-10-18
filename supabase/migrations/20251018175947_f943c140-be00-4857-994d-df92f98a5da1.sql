-- Phase 3B: Add live/in-play support columns

-- Add live tracking to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS match_time INTEGER,
ADD COLUMN IF NOT EXISTS live_score JSONB;

-- Add live tracking to market_odds table
ALTER TABLE market_odds
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS odds_movement TEXT;

-- Add opportunity type and live tracking to arbitrage_opportunities
ALTER TABLE arbitrage_opportunities
ADD COLUMN IF NOT EXISTS opportunity_type TEXT DEFAULT 'pre-match',
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_live ON arbitrage_opportunities(is_live, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_odds_live ON market_odds(is_live, last_update DESC);
CREATE INDEX IF NOT EXISTS idx_events_live ON events(is_live, commence_time);