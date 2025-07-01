export interface User {
  id: string;
  email: string;
  display_name: string | null;
  global_chips: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface PokerRoom {
  id: string;
  room_code: string;
  pot: number;
  current_bet: number;
  created_by: string | null;
  created_at: string;
  last_activity: string;
}

export interface PokerPlayer {
  id: string;
  room_id: string;
  user_id: string;
  player_name: string;
  chips: number;
  current_bet: number;
  has_folded: boolean;
  has_checked: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface PokerActivity {
  id: string;
  room_id: string;
  user_id: string | null;
  player_name: string;
  action_type: 'join' | 'leave' | 'bet' | 'take' | 'fold' | 'check' | 'reconnect';
  amount: number | null;
  message: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  stripe_checkout_session_id: string | null;
  amount_cents: number;
  chips_purchased: number;
  status: 'pending' | 'completed' | 'failed';
  currency: string;
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
}

export interface UserGameSession {
  id: string;
  user_id: string;
  room_code: string;
  player_name: string;
  starting_chips: number;
  ending_chips: number;
  net_change: number;
  total_bets: number;
  total_winnings: number;
  hands_played: number;
  hands_won: number;
  biggest_win: number;
  biggest_loss: number;
  session_duration: number;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserBettingHistory {
  id: string;
  user_id: string;
  session_id: string;
  room_code: string;
  action_type: string;
  amount: number | null;
  pot_before: number;
  pot_after: number;
  chips_before: number;
  chips_after: number;
  hand_number: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string | null;
  value: number | null;
  unlocked_at: string;
  room_code: string | null;
}

export interface ChipPackage {
  id: string;
  name: string;
  chips: number;
  price: number;
  popular: boolean;
  bonus?: number;
}

export interface GameState {
  room: PokerRoom;
  players: PokerPlayer[];
  activities: PokerActivity[];
  currentPlayer?: PokerPlayer;
}