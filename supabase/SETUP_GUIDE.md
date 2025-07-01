# Supabase Database Setup Guide

Follow these steps to set up your PokerChips.io database in Supabase:

## Step 1: Create Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup-step-by-step.sql`
4. Click **Run** to create all tables

## Step 2: Create Indexes

1. In the SQL Editor, copy and paste the contents of `setup-indexes.sql`
2. Click **Run** to create performance indexes

## Step 3: Set up Row Level Security

1. In the SQL Editor, copy and paste the contents of `setup-rls.sql`
2. Click **Run** to enable RLS and create security policies

## Step 4: Create Functions and Triggers

1. In the SQL Editor, copy and paste the contents of `setup-functions.sql`
2. Click **Run** to create the user creation trigger and cleanup functions

## Step 5: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## Step 6: Verify Setup

After running all scripts, you should have these tables:
- `users`
- `poker_rooms`
- `poker_players`
- `poker_activity`
- `payments`
- `payment_history`
- `user_game_sessions`
- `user_betting_history`
- `user_achievements`

## Step 7: Test the Setup

1. Try signing up through your app
2. Check if a user record is created in the `users` table
3. Check if a welcome achievement is created
4. Test creating a room and joining it

## Troubleshooting

**Error: "must be owner of table users"**
- This happens if you try to modify `auth.users` - use the step-by-step files instead

**Error: "relation already exists"**
- Tables already exist, you can skip Step 1 or drop existing tables first

**Error: "policy already exists"**
- Policies already exist, you can skip Step 3 or drop existing policies first

**Trigger not working**
- Make sure you've run Step 4 and the function was created successfully
- Check the Supabase logs for any errors

## Optional: Enable Realtime (for future enhancements)

If you want to use Supabase Realtime instead of polling:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE poker_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE poker_players;
ALTER PUBLICATION supabase_realtime ADD TABLE poker_activity;
```

This is optional - the app currently uses polling for reliability.