import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { roomCode, userId, displayName } = await request.json();

    if (!roomCode || !userId || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service role client for server-side operations
    const supabase = getServiceSupabase();

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('poker_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check user's global chips
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('global_chips')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.global_chips < 1000) {
      return NextResponse.json(
        { error: 'Insufficient chips. You need at least 1,000 chips to join a table.' },
        { status: 400 }
      );
    }

    // Check if user is already in the room
    const { data: existingPlayer } = await supabase
      .from('poker_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      // User is already in room, just mark as online
      await supabase
        .from('poker_players')
        .update({
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', existingPlayer.id);

      return NextResponse.json({
        success: true,
        roomId: room.id,
        playerId: existingPlayer.id,
        rejoined: true
      });
    }

    // Check room capacity
    const { count: playerCount } = await supabase
      .from('poker_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
      .eq('is_online', true);

    if ((playerCount || 0) >= 8) {
      return NextResponse.json(
        { error: 'Table is full (8 players maximum)' },
        { status: 400 }
      );
    }

    // Deduct 1000 chips from global balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        global_chips: user.global_chips - 1000,
        display_name: displayName
      })
      .eq('id', userId);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to join table' },
        { status: 500 }
      );
    }

    // Add player to table
    const { data: newPlayer, error: playerError } = await supabase
      .from('poker_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        player_name: displayName,
        chips: 1000,
        current_bet: 0,
        has_folded: false,
        has_checked: false,
        is_online: true,
      })
      .select()
      .single();

    if (playerError) {
      // Rollback balance change
      await supabase
        .from('users')
        .update({
          global_chips: user.global_chips
        })
        .eq('id', userId);

      console.error('Error creating player:', playerError);
      return NextResponse.json(
        { error: 'Failed to join table' },
        { status: 500 }
      );
    }

    // Create game session
    await supabase
      .from('user_game_sessions')
      .insert({
        user_id: userId,
        room_code: roomCode.toUpperCase(),
        player_name: displayName,
        starting_chips: 1000,
        ending_chips: 1000,
        is_active: true,
      });

    // Add join activity
    await supabase
      .from('poker_activity')
      .insert({
        room_id: room.id,
        user_id: userId,
        player_name: displayName,
        action_type: 'join',
        message: `${displayName} joined the table`,
      });

    return NextResponse.json({
      success: true,
      roomId: room.id,
      playerId: newPlayer.id,
      rejoined: false
    });

  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}