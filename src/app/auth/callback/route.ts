import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const paymentStatus = requestUrl.searchParams.get('payment_status');
  const sessionId = requestUrl.searchParams.get('session_id');

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`);
      }

      // If returning from Stripe, include payment status
      if (paymentStatus) {
        const redirectUrl = new URL(requestUrl.origin);
        redirectUrl.searchParams.set('payment_status', paymentStatus);
        if (sessionId) {
          redirectUrl.searchParams.set('session_id', sessionId);
        }
        return NextResponse.redirect(redirectUrl.toString());
      }

      return NextResponse.redirect(requestUrl.origin);
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`);
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(requestUrl.origin);
}