import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      try {
        // Get service role client for server-side operations
        const supabase = getServiceSupabase();
        
        // Get current user data
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('global_chips')
          .eq('id', session.metadata!.user_id)
          .single();

        if (userError || !user) {
          console.error('User not found:', session.metadata!.user_id);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const chipsToAdd = parseInt(session.metadata!.chips);
        const newBalance = user.global_chips + chipsToAdd;

        // Update user chips
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            global_chips: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.metadata!.user_id);

        if (updateError) throw updateError;

        // Update payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'completed',
            payment_method: session.payment_method_types[0],
            completed_at: new Date().toISOString(),
            metadata: {
              ...session.metadata,
              customer_email: session.customer_email,
              session_id: session.id,
            }
          })
          .eq('stripe_checkout_session_id', session.id);

        if (paymentError) throw paymentError;

        // Record in payment history
        const { error: historyError } = await supabase
          .from('payment_history')
          .insert({
            user_id: session.metadata!.user_id,
            action_type: 'purchase',
            amount_cents: session.amount_total!,
            chips_amount: chipsToAdd,
            description: `Purchased ${chipsToAdd.toLocaleString()} chips - ${session.metadata!.package_id}`
          });

        if (historyError) throw historyError;

        // Check for first purchase achievement
        const { count } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.metadata!.user_id)
          .eq('status', 'completed');

        if (count === 1) {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: session.metadata!.user_id,
              achievement_type: 'first_purchase',
              achievement_name: 'First Purchase',
              description: 'Made your first chip purchase',
              value: chipsToAdd
            });
        }

        // Check for big spender achievement
        if (chipsToAdd >= 10000) {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: session.metadata!.user_id,
              achievement_type: 'big_spender',
              achievement_name: 'Big Spender',
              description: 'Purchased 10,000+ chips in a single transaction',
              value: chipsToAdd
            });
        }

        console.log(`Payment completed for user ${session.metadata!.user_id}: +${chipsToAdd} chips`);
      } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json(
          { error: 'Error processing payment' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}