import { ChipPackage } from '@/types';

export const CHIP_PACKAGES: ChipPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    chips: 1000,
    price: 499, // $4.99 in cents
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    chips: 3000, // 2500 + 500 bonus
    price: 999,
    popular: true,
    bonus: 500,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    chips: 6500, // 5000 + 1500 bonus
    price: 1999,
    popular: false,
    bonus: 1500,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    chips: 14000, // 10000 + 4000 bonus
    price: 3499,
    popular: false,
    bonus: 4000,
  }
];

export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const formatChips = (chips: number): string => {
  return new Intl.NumberFormat('en-US').format(chips);
};