-- Create markets table to define all supported market types
CREATE TABLE public.markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  market_type TEXT NOT NULL, -- '2-way', '3-way', 'n-way'
  typical_outcomes JSONB,
  applicable_sports TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for markets" 
ON public.markets 
FOR SELECT 
USING (true);

-- Create market_odds table to store odds for all market types
CREATE TABLE public.market_odds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  market_key TEXT NOT NULL,
  bookmaker_id UUID REFERENCES public.bookmakers(id),
  outcomes JSONB NOT NULL,
  market_line NUMERIC,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_odds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for market odds" 
ON public.market_odds 
FOR SELECT 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_market_odds_event_id ON public.market_odds(event_id);
CREATE INDEX idx_market_odds_market_key ON public.market_odds(market_key);
CREATE INDEX idx_market_odds_bookmaker_id ON public.market_odds(bookmaker_id);

-- Update arbitrage_opportunities table to include market information
ALTER TABLE public.arbitrage_opportunities 
ADD COLUMN market_key TEXT,
ADD COLUMN market_display_name TEXT,
ADD COLUMN is_cross_market BOOLEAN DEFAULT false,
ADD COLUMN market_line NUMERIC;

-- Seed initial market definitions
INSERT INTO public.markets (market_key, display_name, market_type, typical_outcomes, applicable_sports, description) VALUES
('h2h', 'Match Winner', '2-way', '[{"name": "Team A"}, {"name": "Team B"}]', ARRAY['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl', 'tennis_atp_french_open', 'tennis_atp_wimbledon', 'tennis_atp_us_open', 'tennis_wta_french_open', 'tennis_wta_wimbledon', 'mma_mixed_martial_arts', 'boxing_heavyweight'], 'Two-way match winner market'),
('h2h_3way', '1X2 (Win/Draw/Win)', '3-way', '[{"name": "Home"}, {"name": "Draw"}, {"name": "Away"}]', ARRAY['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_uefa_champs_league', 'soccer_uefa_europa_league', 'icehockey_nhl', 'cricket_test_match', 'cricket_odi'], 'Three-way market with draw option'),
('totals', 'Over/Under', '2-way', '[{"name": "Over"}, {"name": "Under"}]', ARRAY['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl', 'soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a', 'soccer_france_ligue_one'], 'Total points/goals over or under a line'),
('spreads', 'Spread/Handicap', '2-way', '[{"name": "Team A"}, {"name": "Team B"}]', ARRAY['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl'], 'Point spread or handicap market'),
('btts', 'Both Teams To Score', '2-way', '[{"name": "Yes"}, {"name": "No"}]', ARRAY['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_uefa_champs_league', 'soccer_uefa_europa_league'], 'Whether both teams will score');