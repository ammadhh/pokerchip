'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import ChipDisplay from '@/components/ui/ChipDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { formatTimestamp, formatDuration, calculateWinRate } from '@/lib/utils';
import { UserGameSession, UserBettingHistory, Payment, UserAchievement } from '@/types';

interface UserStats {
  totalGames: number;
  netProfit: number;
  winRate: number;
  totalTimePlayed: number;
}

function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'sessions' | 'betting' | 'payments' | 'achievements'>('sessions');
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalGames: 0,
    netProfit: 0,
    winRate: 0,
    totalTimePlayed: 0,
  });
  const [gameSessions, setGameSessions] = useState<UserGameSession[]>([]);
  const [bettingHistory, setBettingHistory] = useState<UserBettingHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchProfileData();
    }
  }, [user, authLoading, router]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch game sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch betting history
      const { data: bettingData, error: bettingError } = await supabase
        .from('user_betting_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (bettingError) throw bettingError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Calculate stats
      const sessions = sessionsData || [];
      const totalGames = sessions.length;
      const netProfit = sessions.reduce((sum, session) => sum + session.net_change, 0);
      const totalWins = sessions.filter(session => session.net_change > 0).length;
      const winRate = calculateWinRate(totalWins, totalGames);
      const totalTimePlayed = sessions.reduce((sum, session) => sum + session.session_duration, 0);

      setUserStats({
        totalGames,
        netProfit,
        winRate,
        totalTimePlayed,
      });

      setGameSessions(sessions);
      setBettingHistory(bettingData || []);
      setPayments(paymentsData || []);
      setAchievements(achievementsData || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  const tabs = [
    { id: 'sessions', label: 'Game Sessions', count: gameSessions.length },
    { id: 'betting', label: 'Betting History', count: bettingHistory.length },
    { id: 'payments', label: 'Payments', count: payments.length },
    { id: 'achievements', label: 'Achievements', count: achievements.length },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-dark to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* User Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* User Info Card */}
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-poker-blue to-poker-green rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {userProfile.display_name || 'Player'}
                  {userProfile.is_admin && (
                    <span className="ml-2 px-2 py-1 bg-poker-yellow text-gray-900 text-xs rounded-full font-semibold">
                      ADMIN
                    </span>
                  )}
                </h2>
                <p className="text-gray-400">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Global Chips</span>
                <ChipDisplay chips={userProfile.global_chips} size="sm" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-white mb-1">{userStats.totalGames}</div>
              <div className="text-gray-400 text-sm">Games Played</div>
            </div>
            
            <div className="card text-center">
              <div className={`text-2xl font-bold mb-1 ${userStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {userStats.netProfit >= 0 ? '+' : ''}{userStats.netProfit.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Net Profit/Loss</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold text-white mb-1">{userStats.winRate}%</div>
              <div className="text-gray-400 text-sm">Win Rate</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatDuration(userStats.totalTimePlayed)}
              </div>
              <div className="text-gray-400 text-sm">Time Played</div>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="card">
          {/* Tab Headers */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-poker-blue text-poker-blue'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Game Sessions</h3>
                {gameSessions.length === 0 ? (
                  <p className="text-gray-400">No game sessions yet. Join a table to start playing!</p>
                ) : (
                  <div className="space-y-3">
                    {gameSessions.map(session => (
                      <div key={session.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Table {session.room_code}</span>
                            {session.is_active && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">ACTIVE</span>
                            )}
                          </div>
                          <div className={`font-semibold ${session.net_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {session.net_change >= 0 ? '+' : ''}{session.net_change}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                          <div>
                            <span className="text-gray-500">Started:</span> {session.starting_chips}
                          </div>
                          <div>
                            <span className="text-gray-500">Ended:</span> {session.ending_chips}
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span> {formatDuration(session.session_duration)}
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span> {formatTimestamp(session.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'betting' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Betting History</h3>
                {bettingHistory.length === 0 ? (
                  <p className="text-gray-400">No betting history yet.</p>
                ) : (
                  <div className="space-y-2">
                    {bettingHistory.map(bet => (
                      <div key={bet.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bet.action_type === 'bet' ? 'bg-blue-600 text-white' :
                              bet.action_type === 'take' ? 'bg-yellow-600 text-gray-900' :
                              'bg-gray-600 text-white'
                            }`}>
                              {bet.action_type.toUpperCase()}
                            </span>
                            <span className="text-sm">Table {bet.room_code}</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            {formatTimestamp(bet.created_at)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-300">
                          Amount: {bet.amount || 0} | Pot: {bet.pot_before} → {bet.pot_after} | Chips: {bet.chips_before} → {bet.chips_after}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment History</h3>
                {payments.length === 0 ? (
                  <p className="text-gray-400">No payments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map(payment => (
                      <div key={payment.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              payment.status === 'completed' ? 'bg-green-600 text-white' :
                              payment.status === 'pending' ? 'bg-yellow-600 text-gray-900' :
                              'bg-red-600 text-white'
                            }`}>
                              {payment.status.toUpperCase()}
                            </span>
                            <span>${(payment.amount_cents / 100).toFixed(2)}</span>
                          </div>
                          <div className="text-poker-yellow font-semibold">
                            +{payment.chips_purchased.toLocaleString()} chips
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          {formatTimestamp(payment.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Achievements</h3>
                {achievements.length === 0 ? (
                  <p className="text-gray-400">No achievements unlocked yet. Keep playing to earn some!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map(achievement => (
                      <div key={achievement.id} className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-900" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{achievement.achievement_name}</h4>
                            <p className="text-sm text-gray-800">{achievement.description}</p>
                            <p className="text-xs text-gray-700">
                              Unlocked {formatTimestamp(achievement.unlocked_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>
  );
}