'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import ChipDisplay from '@/components/ui/ChipDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { GameState, PokerPlayer, PokerActivity } from '@/types';
import { formatTimestamp } from '@/lib/utils';

function GameTable() {
  const { user, userProfile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PokerPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [betAmount, setBetAmount] = useState<string>('');
  const [customBetAmount, setCustomBetAmount] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const quickBetAmounts = [25, 50, 100, 250, 500];

  // Fetch game state
  const fetchGameState = useCallback(async () => {
    try {
      setConnectionStatus('connected');
      
      // Get room data
      const { data: room, error: roomError } = await supabase
        .from('poker_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (roomError || !room) {
        router.push('/');
        return;
      }

      // Get players
      const { data: players, error: playersError } = await supabase
        .from('poker_players')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at');

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('poker_activity')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (playersError || activitiesError) {
        console.error('Error fetching game data:', playersError || activitiesError);
        setConnectionStatus('disconnected');
        return;
      }

      setGameState({
        room,
        players: players || [],
        activities: activities || [],
      });

      // Find current player
      if (user) {
        const myPlayer = players?.find(p => p.user_id === user.id);
        setCurrentPlayer(myPlayer || null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching game state:', error);
      setConnectionStatus('disconnected');
    }
  }, [roomCode, user, router]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!user || !currentPlayer) return;

    try {
      await supabase
        .from('poker_players')
        .update({
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', currentPlayer.id);
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, [user, currentPlayer]);

  // Join table
  const joinTable = useCallback(async () => {
    if (!user || !userProfile?.display_name || !gameState) return;

    try {
      // Check if already in game
      const existingPlayer = gameState.players.find(p => p.user_id === user.id);
      if (existingPlayer) {
        // Just mark as online
        await supabase
          .from('poker_players')
          .update({
            is_online: true,
            last_seen: new Date().toISOString()
          })
          .eq('id', existingPlayer.id);

        setCurrentPlayer(existingPlayer);
        return;
      }

      // Check if user has enough global chips
      if ((userProfile.global_chips || 0) < 1000) {
        alert('You need at least 1,000 chips to join a table. Please buy more chips.');
        router.push('/');
        return;
      }

      // Check room capacity
      const activePlayers = gameState.players.filter(p => p.is_online).length;
      if (activePlayers >= 8) {
        alert('This table is full (8 players maximum).');
        router.push('/');
        return;
      }

      // Deduct 1000 chips from global balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          global_chips: userProfile.global_chips - 1000
        })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Add player to table
      const { data: newPlayer, error: playerError } = await supabase
        .from('poker_players')
        .insert({
          room_id: gameState.room.id,
          user_id: user.id,
          player_name: userProfile.display_name,
          chips: 1000,
          current_bet: 0,
          has_folded: false,
          has_checked: false,
          is_online: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Create game session
      await supabase
        .from('user_game_sessions')
        .insert({
          user_id: user.id,
          room_code: roomCode,
          player_name: userProfile.display_name,
          starting_chips: 1000,
          ending_chips: 1000,
          is_active: true,
        });

      // Add activity
      await supabase
        .from('poker_activity')
        .insert({
          room_id: gameState.room.id,
          user_id: user.id,
          player_name: userProfile.display_name,
          action_type: 'join',
          message: `${userProfile.display_name} joined the table`,
        });

      setCurrentPlayer(newPlayer);
    } catch (error) {
      console.error('Error joining table:', error);
      alert('Failed to join table. Please try again.');
    }
  }, [user, userProfile, gameState, roomCode, router]);

  // Game actions
  const placeBet = async (amount: number) => {
    if (!currentPlayer || !gameState || processing) return;
    
    if (amount > currentPlayer.chips) {
      alert('Not enough chips!');
      return;
    }

    if (amount <= 0) {
      alert('Bet amount must be greater than 0');
      return;
    }

    setProcessing(true);
    try {
      // Update player chips and current bet
      await supabase
        .from('poker_players')
        .update({
          chips: currentPlayer.chips - amount,
          current_bet: amount,
        })
        .eq('id', currentPlayer.id);

      // Update pot
      await supabase
        .from('poker_rooms')
        .update({
          pot: gameState.room.pot + amount,
          last_activity: new Date().toISOString(),
        })
        .eq('id', gameState.room.id);

      // Add activity
      await supabase
        .from('poker_activity')
        .insert({
          room_id: gameState.room.id,
          user_id: user?.id,
          player_name: currentPlayer.player_name,
          action_type: 'bet',
          amount,
          message: `${currentPlayer.player_name} bet ${amount} chips`,
        });

      setBetAmount('');
      setCustomBetAmount('');
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const takeChips = async (amount: number) => {
    if (!currentPlayer || !gameState || processing) return;
    
    if (amount > gameState.room.pot) {
      alert('Not enough chips in pot!');
      return;
    }

    if (amount <= 0) {
      alert('Take amount must be greater than 0');
      return;
    }

    setProcessing(true);
    try {
      // Update player chips
      await supabase
        .from('poker_players')
        .update({
          chips: currentPlayer.chips + amount,
        })
        .eq('id', currentPlayer.id);

      // Update pot
      await supabase
        .from('poker_rooms')
        .update({
          pot: gameState.room.pot - amount,
          last_activity: new Date().toISOString(),
        })
        .eq('id', gameState.room.id);

      // Update global chips (this will be handled by trigger in production)
      if (userProfile) {
        await supabase
          .from('users')
          .update({
            global_chips: userProfile.global_chips + amount
          })
          .eq('id', user?.id);
      }

      // Add activity
      await supabase
        .from('poker_activity')
        .insert({
          room_id: gameState.room.id,
          user_id: user?.id,
          player_name: currentPlayer.player_name,
          action_type: 'take',
          amount,
          message: `${currentPlayer.player_name} took ${amount} chips from pot`,
        });
    } catch (error) {
      console.error('Error taking chips:', error);
      alert('Failed to take chips. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const foldHand = async () => {
    if (!currentPlayer || processing) return;

    setProcessing(true);
    try {
      await supabase
        .from('poker_players')
        .update({
          has_folded: true,
          current_bet: 0,
        })
        .eq('id', currentPlayer.id);

      // Add activity
      await supabase
        .from('poker_activity')
        .insert({
          room_id: gameState?.room.id,
          user_id: user?.id,
          player_name: currentPlayer.player_name,
          action_type: 'fold',
          message: `${currentPlayer.player_name} folded`,
        });
    } catch (error) {
      console.error('Error folding:', error);
      alert('Failed to fold. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const leaveTable = async () => {
    if (!currentPlayer || !user) return;

    if (confirm('Are you sure you want to leave the table?')) {
      try {
        // Mark as offline
        await supabase
          .from('poker_players')
          .update({
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', currentPlayer.id);

        // End game session
        await supabase
          .from('user_game_sessions')
          .update({
            is_active: false,
            left_at: new Date().toISOString(),
            ending_chips: currentPlayer.chips,
            net_change: currentPlayer.chips - 1000,
          })
          .eq('user_id', user.id)
          .eq('room_code', roomCode)
          .eq('is_active', true);

        // Add activity
        await supabase
          .from('poker_activity')
          .insert({
            room_id: gameState?.room.id,
            user_id: user.id,
            player_name: currentPlayer.player_name,
            action_type: 'leave',
            message: `${currentPlayer.player_name} left the table`,
          });

        router.push('/');
      } catch (error) {
        console.error('Error leaving table:', error);
        alert('Failed to leave table. Please try again.');
      }
    }
  };

  // Set up polling and heartbeat
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Initial fetch
    fetchGameState();

    // Set up polling
    const pollInterval = setInterval(fetchGameState, 500);
    
    // Set up heartbeat
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    };
  }, [user, fetchGameState, sendHeartbeat, router]);

  // Auto-join table when game state is loaded
  useEffect(() => {
    if (gameState && user && userProfile && !currentPlayer && !loading) {
      joinTable();
    }
  }, [gameState, user, userProfile, currentPlayer, loading, joinTable]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Room not found</h2>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">
              Table {roomCode}
            </h1>
            <div className={`flex items-center gap-2 ${connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{connectionStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {userProfile && <ChipDisplay chips={userProfile.global_chips} size="sm" />}
            <button
              onClick={leaveTable}
              className="btn-danger"
            >
              Leave Table
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Pot Display */}
          <div className="poker-table w-96 h-96 flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-poker-yellow mb-2">
                <ChipDisplay chips={gameState.room.pot} size="lg" />
              </div>
              <div className="text-gray-300 text-lg">POT</div>
            </div>
          </div>

          {/* Player Actions */}
          {currentPlayer && !currentPlayer.has_folded && (
            <div className="card max-w-2xl w-full">
              <h3 className="text-lg font-semibold mb-4">Your Actions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {quickBetAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => placeBet(amount)}
                    disabled={processing || amount > currentPlayer.chips}
                    className="betting-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {amount}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={customBetAmount}
                  onChange={(e) => setCustomBetAmount(e.target.value)}
                  placeholder="Custom amount"
                  max={currentPlayer.chips}
                  min="1"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <button
                  onClick={() => placeBet(parseInt(customBetAmount) || 0)}
                  disabled={processing || !customBetAmount || parseInt(customBetAmount) > currentPlayer.chips}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bet
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => takeChips(gameState.room.pot)}
                  disabled={processing || gameState.room.pot === 0}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Take All ({gameState.room.pot})
                </button>
                <button
                  onClick={foldHand}
                  disabled={processing}
                  className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fold
                </button>
              </div>
            </div>
          )}

          {currentPlayer?.has_folded && (
            <div className="card">
              <p className="text-center text-gray-400">You have folded this hand</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-700 bg-gray-800/30 p-6 flex flex-col">
          {/* Players */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Players ({gameState.players.filter(p => p.is_online).length}/8)</h3>
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, i) => {
                const player = gameState.players[i];
                const isCurrentPlayer = player?.user_id === user?.id;
                
                return (
                  <div
                    key={i}
                    className={`card py-3 ${isCurrentPlayer ? 'border-poker-blue' : ''}`}
                  >
                    {player ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={player.is_online ? 'status-online' : 'status-offline'}></div>
                          <div>
                            <div className="font-medium">
                              {player.player_name}
                              {isCurrentPlayer && <span className="text-poker-blue ml-2">(You)</span>}
                            </div>
                            <ChipDisplay chips={player.chips} size="sm" />
                          </div>
                        </div>
                        {player.has_folded && (
                          <span className="text-red-400 text-sm">Folded</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center">Empty seat</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4">Activity</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gameState.activities.map((activity) => (
                <div key={activity.id} className="text-sm">
                  <div className={`activity-${activity.action_type}`}>
                    {activity.message}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatTimestamp(activity.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TablePage() {
  return (
    <AuthProvider>
      <GameTable />
    </AuthProvider>
  );
}