-- STEP 2: Create indexes for performance (run after tables are created)
CREATE INDEX idx_poker_players_room_id ON poker_players(room_id);
CREATE INDEX idx_poker_players_user_id ON poker_players(user_id);
CREATE INDEX idx_poker_activity_room_id ON poker_activity(room_id);
CREATE INDEX idx_poker_rooms_room_code ON poker_rooms(room_code);
CREATE INDEX idx_poker_players_last_seen ON poker_players(last_seen);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_user_game_sessions_user_id ON user_game_sessions(user_id);
CREATE INDEX idx_user_betting_history_user_id ON user_betting_history(user_id);