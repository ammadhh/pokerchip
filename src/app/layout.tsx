import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PokerChips.io - Virtual Poker Chips',
  description: 'Real-time virtual poker chip tracking for your home games',
  keywords: 'poker, chips, virtual, tracking, home games, poker night',
  authors: [{ name: 'PokerChips.io' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-poker-dark">
          {children}
        </main>
      </body>
    </html>
  );
}