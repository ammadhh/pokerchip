'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import LoginButton from '@/components/auth/LoginButton';
import ChipDisplay from '@/components/ui/ChipDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { generateRoomCode, validateDisplayName } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

function HomePage() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showBuyChips, setShowBuyChips] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (userProfile?.display_name) {
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    
    if (paymentStatus === 'success') {
      alert('Payment successful! Your chips have been added to your account.');
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const createNewTable = async () => {
    if (!user || !validateDisplayName(displayName)) {
      alert('Please enter a valid display name (2-20 alphanumeric characters)');
      return;
    }

    setCreating(true);
    try {
      const roomCode = generateRoomCode();
      
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('poker_rooms')
        .insert({
          room_code: roomCode,
          pot: 0,
          current_bet: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Update display name if changed
      if (displayName !== userProfile?.display_name) {
        await supabase
          .from('users')
          .update({ display_name: displayName })
          .eq('id', user.id);
      }

      router.push(`/table/${roomCode}`);
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Failed to create table. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const joinTable = async (code: string) => {
    if (!user || !validateDisplayName(displayName)) {
      alert('Please enter a valid display name (2-20 alphanumeric characters)');
      return;
    }

    if (!code.trim()) {
      alert('Please enter a room code');
      return;
    }

    setJoining(true);
    try {
      // Check if room exists
      const { data: room, error } = await supabase
        .from('poker_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .single();

      if (error || !room) {
        alert('Room not found. Please check the code and try again.');
        return;
      }

      // Update display name if changed
      if (displayName !== userProfile?.display_name) {
        await supabase
          .from('users')
          .update({ display_name: displayName })
          .eq('id', user.id);
      }

      router.push(`/table/${code.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining table:', error);
      alert('Failed to join table. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-poker-dark to-gray-900">
        <div className="text-center space-y-8 max-w-md mx-auto px-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white mb-2">
              poker<span className="text-poker-yellow">chips</span>.io
            </h1>
            <p className="text-xl text-gray-300">
              Virtual poker chips for your home games
            </p>
            <p className="text-gray-400">
              Track bets, manage chips, and keep your poker nights organized
            </p>
          </div>
          
          <div className="space-y-4">
            <LoginButton />
            <p className="text-sm text-gray-500">
              Sign in to get started with 1,000 free chips
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-dark to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            poker<span className="text-poker-yellow">chips</span>.io
          </h1>
          
          <div className="flex items-center gap-6">
            <ChipDisplay chips={userProfile?.global_chips || 0} />
            
            <button
              onClick={() => setShowBuyChips(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Buy Chips
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="btn-secondary"
            >
              Profile
            </button>
            
            <button
              onClick={signOut}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome back, {userProfile?.display_name || user.email}!
            </h2>
            <p className="text-gray-300">
              Create a new table or join an existing game
            </p>
          </div>

          <div className="card max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-poker-blue"
              />
              <p className="text-xs text-gray-500 mt-1">
                2-20 alphanumeric characters only
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={createNewTable}
                disabled={creating || !validateDisplayName(displayName)}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Creating...
                  </div>
                ) : (
                  'Create New Table'
                )}
              </button>

              <button
                onClick={() => joinTable('DEMO1')}
                disabled={joining || !validateDisplayName(displayName)}
                className="w-full bg-poker-yellow hover:bg-yellow-600 text-gray-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Demo Game
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-800 px-2 text-gray-400">or</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={5}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-poker-blue uppercase"
                />
                <button
                  onClick={() => joinTable(joinCode)}
                  disabled={joining || !validateDisplayName(displayName)}
                  className="btn-secondary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? <LoadingSpinner size="sm" /> : 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}