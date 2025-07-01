-- STEP 4: Create functions and triggers (run after RLS setup)

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;