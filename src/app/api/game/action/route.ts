import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { action, playerId, amount, userId } = await request.json();

    if (!action || !playerId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get player data
    const { data: player, error: playerError } = await supabase
      .from('poker_players')
      .select('*, poker_rooms(*)')
      .eq('id', playerId)
      .eq('user_id', userId)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const room = player.poker_rooms;
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'bet':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'Invalid bet amount' },
            { status: 400 }
          );
        }

        if (amount > player.chips) {
          return NextResponse.json(
            { error: 'Insufficient chips' },
            { status: 400 }
          );
        }

        // Update player chips and current bet
        await supabase
          .from('poker_players')
          .update({
            chips: player.chips - amount,
            current_bet: amount,
          })
          .eq('id', playerId);

        // Update pot
        await supabase
          .from('poker_rooms')
          .update({
            pot: room.pot + amount,
            last_activity: new Date().toISOString(),
          })
          .eq('id', room.id);

        // Add activity
        await supabase
          .from('poker_activity')
          .insert({
            room_id: room.id,
            user_id: userId,
            player_name: player.player_name,
            action_type: 'bet',
            amount,
            message: `${player.player_name} bet ${amount} chips`,
          });

        // Add to betting history
        await supabase
          .from('user_betting_history')
          .insert({
            user_id: userId,
            room_code: room.room_code,
            action_type: 'bet',
            amount,
            pot_before: room.pot,
            pot_after: room.pot + amount,
            chips_before: player.chips,
            chips_after: player.chips - amount,
          });

        break;

      case 'take':
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'Invalid take amount' },
            { status: 400 }
          );
        }

        if (amount > room.pot) {
          return NextResponse.json(
            { error: 'Not enough chips in pot' },
            { status: 400 }
          );
        }

        // Update player chips
        await supabase
          .from('poker_players')
          .update({
            chips: player.chips + amount,
          })
          .eq('id', playerId);

        // Update pot
        await supabase
          .from('poker_rooms')
          .update({
            pot: room.pot - amount,
            last_activity: new Date().toISOString(),
          })
          .eq('id', room.id);

        // Update global chips
        const { data: user } = await supabase
          .from('users')
          .select('global_chips')
          .eq('id', userId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              global_chips: user.global_chips + amount
            })
            .eq('id', userId);
        }

        // Add activity
        await supabase
          .from('poker_activity')
          .insert({
            room_id: room.id,
            user_id: userId,
            player_name: player.player_name,
            action_type: 'take',
            amount,
            message: `${player.player_name} took ${amount} chips from pot`,
          });

        // Add to betting history
        await supabase
          .from('user_betting_history')
          .insert({
            user_id: userId,
            room_code: room.room_code,
            action_type: 'take',
            amount,
            pot_before: room.pot,
            pot_after: room.pot - amount,
            chips_before: player.chips,
            chips_after: player.chips + amount,
          });

        break;

      case 'fold':
        await supabase
          .from('poker_players')
          .update({
            has_folded: true,
            current_bet: 0,
          })
          .eq('id', playerId);

        // Add activity
        await supabase
          .from('poker_activity')
          .insert({
            room_id: room.id,
            user_id: userId,
            player_name: player.player_name,
            action_type: 'fold',
            message: `${player.player_name} folded`,
          });

        break;

      case 'check':
        await supabase
          .from('poker_players')
          .update({
            has_checked: true,
          })
          .eq('id', playerId);

        // Add activity
        await supabase
          .from('poker_activity')
          .insert({
            room_id: room.id,
            user_id: userId,
            player_name: player.player_name,
            action_type: 'check',
            message: `${player.player_name} checked`,
          });

        break;

      case 'heartbeat':
        await supabase
          .from('poker_players')
          .update({
            is_online: true,
            last_seen: new Date().toISOString()
          })
          .eq('id', playerId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Game action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}