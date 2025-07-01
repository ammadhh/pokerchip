'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CHIP_PACKAGES, formatPrice, formatChips } from '@/lib/stripe';
import LoadingSpinner from './LoadingSpinner';

interface BuyChipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyChipsModal({ isOpen, onClose }: BuyChipsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async (packageId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId: user.id
        })
      });

      const { url, error } = await response.json();
      
      if (error) {
        alert('Error creating checkout: ' + error);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Buy Chips</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHIP_PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`relative bg-gray-700 border-2 rounded-xl p-6 text-center transition-all hover:scale-105 ${
                  pkg.popular ? 'border-poker-yellow' : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-poker-yellow text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-poker-yellow">
                      {formatChips(pkg.chips - (pkg.bonus || 0))}
                    </div>
                    
                    {pkg.bonus && (
                      <div className="text-lg text-green-400 font-semibold">
                        +{formatChips(pkg.bonus)} bonus!
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-400 border-t border-gray-600 pt-2">
                      Total: {formatChips(pkg.chips)} chips
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(pkg.price)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {(pkg.price / pkg.chips * 100).toFixed(1)}¢ per chip
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    pkg.popular
                      ? 'bg-poker-yellow hover:bg-yellow-600 text-gray-900'
                      : 'bg-poker-blue hover:bg-blue-600 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Processing...
                    </div>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/>
              </svg>
              <div className="text-sm text-gray-300">
                <p className="font-semibold mb-1">Secure Payment</p>
                <p>
                  Your payment is processed securely by Stripe. We never store your card information.
                  Chips are added to your account immediately after successful payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}