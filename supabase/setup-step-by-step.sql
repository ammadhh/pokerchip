-- STEP 1: Create the main tables (run this first)
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

-- Insert demo room
INSERT INTO poker_rooms (room_code, pot, created_by)
VALUES ('DEMO1', 0, NULL);