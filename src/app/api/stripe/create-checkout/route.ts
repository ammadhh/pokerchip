import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { CHIP_PACKAGES } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { packageId, userId } = await request.json();

    if (!packageId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const chipPackage = CHIP_PACKAGES.find(p => p.id === packageId);
    if (!chipPackage) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: chipPackage.name,
            description: `${chipPackage.chips.toLocaleString()} poker chips${chipPackage.bonus ? ` (+${chipPackage.bonus} bonus!)` : ''}`,
            metadata: {
              chips: chipPackage.chips.toString(),
              package_id: chipPackage.id,
            }
          },
          unit_amount: chipPackage.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/auth/callback?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/?payment_status=cancelled`,
      customer_email: user.email,
      metadata: {
        user_id: userId,
        package_id: packageId,
        chips: chipPackage.chips.toString(),
      },
    });

    // Store pending payment in database
    await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: 'pending',
        stripe_checkout_session_id: session.id,
        amount_cents: chipPackage.price,
        chips_purchased: chipPackage.chips,
        status: 'pending',
        currency: 'usd',
        metadata: {
          package_id: packageId,
          package_name: chipPackage.name,
        }
      });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}