-- PokerChips.io Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  global_chips integer DEFAULT 1000,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Poker rooms table
CREATE TABLE public.poker_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_code character varying NOT NULL UNIQUE,
  pot integer DEFAULT 0,
  current_bet integer DEFAULT 0,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  CONSTRAINT poker_rooms_pkey PRIMARY KEY (id)
);

-- Poker players table
CREATE TABLE public.poker_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.poker_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  player_name character varying NOT NULL,
  chips integer DEFAULT 1000,
  current_bet integer DEFAULT 0,
  has_folded boolean DEFAULT false,
  has_checked boolean DEFAULT false,
  is_online boolean DEFAULT true,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poker_players_pkey PRIMARY KEY (id)
);

-- Poker activity table
CREATE TABLE public.poker_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.poker_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  player_name character varying NOT NULL,
  action_type character varying NOT NULL,
  amount integer,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poker_activity_pkey PRIMARY KEY (id)
);

-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text NOT NULL,
  stripe_checkout_session_id text UNIQUE,
  amount_cents integer NOT NULL,
  chips_purchased integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  currency text NOT NULL DEFAULT 'usd',
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

-- Payment history table
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  amount_cents integer NOT NULL,
  chips_amount integer NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_history_pkey PRIMARY KEY (id)
);

-- User game sessions table
CREATE TABLE public.user_game_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  room_code character varying NOT NULL,
  player_name character varying NOT NULL,
  starting_chips integer DEFAULT 1000,
  ending_chips integer DEFAULT 1000,
  net_change integer DEFAULT 0,
  total_bets integer DEFAULT 0,
  total_winnings integer DEFAULT 0,
  hands_played integer DEFAULT 0,
  hands_won integer DEFAULT 0,
  biggest_win integer DEFAULT 0,
  biggest_loss integer DEFAULT 0,
  session_duration integer DEFAULT 0,
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_game_sessions_pkey PRIMARY KEY (id)
);

-- User betting history table
CREATE TABLE public.user_betting_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.user_game_sessions(id) ON DELETE SET NULL,
  room_code character varying NOT NULL,
  action_type character varying NOT NULL,
  amount integer,
  pot_before integer DEFAULT 0,
  pot_after integer DEFAULT 0,
  chips_before integer DEFAULT 0,
  chips_after integer DEFAULT 0,
  hand_number integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_betting_history_pkey PRIMARY KEY (id)
);

-- User achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type character varying NOT NULL,
  achievement_name character varying NOT NULL,
  description text,
  value integer,
  unlocked_at timestamp with time zone DEFAULT now(),
  room_code character varying,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id)
);

-- Create indexes for performance
CREATE INDEX idx_poker_players_room_id ON poker_players(room_id);
CREATE INDEX idx_poker_players_user_id ON poker_players(user_id);
CREATE INDEX idx_poker_activity_room_id ON poker_activity(room_id);
CREATE INDEX idx_poker_rooms_room_code ON poker_rooms(room_code);
CREATE INDEX idx_poker_players_last_seen ON poker_players(last_seen);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_user_game_sessions_user_id ON user_game_sessions(user_id);
CREATE INDEX idx_user_betting_history_user_id ON user_betting_history(user_id);

-- Row Level Security Policies

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read rooms
CREATE POLICY "Anyone can read rooms" ON poker_rooms
  FOR SELECT USING (true);

-- Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms" ON poker_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Room creators can update their rooms
CREATE POLICY "Room creators can update rooms" ON poker_rooms
  FOR UPDATE USING (created_by = auth.uid());

-- Anyone can read players in rooms
CREATE POLICY "Anyone can read players" ON poker_players
  FOR SELECT USING (true);

-- Users can update their own player data
CREATE POLICY "Users can update own player data" ON poker_players
  FOR UPDATE USING (user_id = auth.uid());

-- Authenticated users can create player entries
CREATE POLICY "Authenticated users can create players" ON poker_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can read activities
CREATE POLICY "Anyone can read activities" ON poker_activity
  FOR SELECT USING (true);

-- Authenticated users can create activities
CREATE POLICY "Authenticated users can create activities" ON poker_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

-- Users can read their own payment history
CREATE POLICY "Users can read own payment history" ON payment_history
  FOR SELECT USING (user_id = auth.uid());

-- Users can read their own game sessions
CREATE POLICY "Users can read own sessions" ON user_game_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own game sessions
CREATE POLICY "Users can update own sessions" ON user_game_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Users can create their own game sessions
CREATE POLICY "Users can create own sessions" ON user_game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own betting history
CREATE POLICY "Users can read own betting history" ON user_betting_history
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own betting history
CREATE POLICY "Users can create own betting history" ON user_betting_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE poker_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_betting_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Functions and Triggers

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, global_chips, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'admin@pokerchips.io' THEN 50000 ELSE 1000 END,
    NEW.email = 'admin@pokerchips.io'
  );
  
  -- Create welcome achievement
  INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, description)
  VALUES (
    NEW.id,
    'welcome',
    'Welcome to PokerChips.io!',
    'Joined the platform and received your starting chips'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Function to cleanup inactive players
CREATE OR REPLACE FUNCTION cleanup_inactive_players()
RETURNS void AS $$
BEGIN
  DELETE FROM poker_players 
  WHERE last_seen < NOW() - INTERVAL '1 hour' 
  AND is_online = false;
END;
$$ LANGUAGE plpgsql;

-- Insert demo room
INSERT INTO poker_rooms (room_code, pot, created_by)
VALUES ('DEMO1', 0, NULL)
ON CONFLICT (room_code) DO NOTHING;

-- Enable realtime for real-time updates (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE poker_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE poker_players;
-- ALTER PUBLICATION supabase_realtime ADD TABLE poker_activity;