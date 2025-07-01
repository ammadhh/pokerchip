# CLAUDE.md - AI Development Notes

## Project Overview

PokerChips.io is a real-time virtual poker chip tracking application built with Next.js 14, Supabase, and Stripe.

## Key Implementation Details

### Authentication Flow
- Google OAuth via Supabase Auth
- New users automatically receive 1,000 starting chips
- Session persistence across browser sessions
- Middleware protection for authenticated routes

### Database Design
- **users**: Core user data with global chip balance
- **poker_rooms**: Game rooms with pot tracking
- **poker_players**: Player state within rooms
- **poker_activity**: Real-time activity feed
- **payments**: Stripe payment records
- **user_game_sessions**: Session tracking for statistics

### Real-Time Synchronization
- 500ms polling interval for game state
- Heartbeat system to track online players
- Automatic cleanup of inactive players after 1 hour
- Optimistic UI updates with server reconciliation

### Chip Economy
- Starting chips: 1,000 for new users
- Room chips separate from global balance
- Taking from pot adds to global balance
- Chip purchases via Stripe (4 packages)

### Key Features to Remember
1. **Pot Mechanics**: When betting, chips go from player → pot. When taking, chips go from pot → player + global balance
2. **Player Cleanup**: Inactive players removed after 1 hour
3. **Demo Room**: "DEMO1" never gets deleted
4. **Admin Users**: Start with 50,000 chips instead of 1,000
5. **Achievements**: Automatically granted for milestones

### API Patterns
- All game actions go through `/api/game/action/[action]`
- Stripe webhooks at `/api/stripe/webhook`
- Protected routes use middleware
- Error handling with proper status codes

### Testing Notes
- Use Stripe test cards (4242 4242 4242 4242)
- Demo room "DEMO1" for quick testing
- Check console for polling/heartbeat logs

### Common Issues & Solutions
1. **Connection drops**: Automatic reconnection built-in
2. **Stale data**: Force refresh with SWR mutate
3. **Payment failures**: Check Stripe webhook logs
4. **Auth issues**: Clear Supabase session cookies

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm test            # Run tests
```

### Deployment Checklist
- [ ] Set production environment variables
- [ ] Configure Supabase production instance
- [ ] Set up Stripe production keys
- [ ] Configure Google OAuth redirect URLs
- [ ] Enable Supabase Row Level Security
- [ ] Set up monitoring and analytics

### Future Enhancements
- WebSocket support for true real-time
- Tournament mode
- Private tables with passwords
- Hand history tracking
- Mobile app versions