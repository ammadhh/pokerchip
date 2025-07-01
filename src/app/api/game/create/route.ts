import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateRoomCode } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { userId, displayName } = await request.json();

    if (!userId || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service role client for server-side operations
    const supabase = getServiceSupabase();

    // Generate unique room code
    let roomCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomCode = generateRoomCode();
      attempts++;

      const { data: existingRoom } = await supabase
        .from('poker_rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single();

      if (!existingRoom) break;

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Unable to generate unique room code' },
          { status: 500 }
        );
      }
    } while (true);

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('poker_rooms')
      .insert({
        room_code: roomCode,
        pot: 0,
        current_bet: 0,
        created_by: userId,
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    // Update user display name if provided
    await supabase
      .from('users')
      .update({ display_name: displayName })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      roomCode: room.room_code,
      roomId: room.id
    });

  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}