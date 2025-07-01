# PokerChips.io

A real-time virtual poker chip tracking application for home games and casual poker nights.

## Features

- 🎯 **Real-time Game Sync**: Ultra-fast 500ms polling for instant updates
- 🔐 **Google OAuth**: Secure authentication via Supabase
- 💰 **Stripe Payments**: Buy chips with secure checkout
- 📊 **Player Statistics**: Track wins, losses, and performance
- 🏆 **Achievements**: Unlock rewards for milestones
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (Google OAuth)
- **Payments**: Stripe
- **Real-time**: SWR with polling

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- Google Cloud Console project (for OAuth)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pokergame.git
cd pokergame
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_URL=http://localhost:3000
```

5. Run database migrations in Supabase

6. Start the development server:
```bash
npm run dev
```

## Game Rules

- **Starting Chips**: New users get 1,000 chips
- **Room Size**: Maximum 8 players per table
- **Demo Room**: "DEMO1" is always available for testing
- **Betting**: Can't bet more than your chip count
- **Taking Chips**: Adds to your global balance

## Development

### Project Structure

```
pokergame/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── lib/          # Utilities and configs
│   └── types/        # TypeScript types
├── public/           # Static assets
└── supabase/         # Database migrations
```

### Key Components

- **Authentication**: Google OAuth via Supabase
- **Real-time Updates**: 500ms polling interval
- **Payment Processing**: Stripe checkout & webhooks
- **State Management**: React hooks + SWR

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.