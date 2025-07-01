-- STEP 3: Enable Row Level Security and create policies (run after indexes)

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

-- Users table policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Poker rooms policies
CREATE POLICY "Anyone can read rooms" ON poker_rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON poker_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update rooms" ON poker_rooms
  FOR UPDATE USING (created_by = auth.uid());

-- Poker players policies
CREATE POLICY "Anyone can read players" ON poker_players
  FOR SELECT USING (true);

CREATE POLICY "Users can update own player data" ON poker_players
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create players" ON poker_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Poker activity policies
CREATE POLICY "Anyone can read activities" ON poker_activity
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create activities" ON poker_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

-- Payment history policies
CREATE POLICY "Users can read own payment history" ON payment_history
  FOR SELECT USING (user_id = auth.uid());

-- Game sessions policies
CREATE POLICY "Users can read own sessions" ON user_game_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON user_game_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions" ON user_game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Betting history policies
CREATE POLICY "Users can read own betting history" ON user_betting_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own betting history" ON user_betting_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can read own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());