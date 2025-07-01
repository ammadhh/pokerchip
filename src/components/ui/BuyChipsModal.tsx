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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Buy Chips</h2>
              <p className="text-gray-400">Choose your chip package and fuel your poker journey</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 p-2 hover:bg-white/10 rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHIP_PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border-2 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${
                  pkg.popular ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-white/20 hover:border-white/40'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⭐ Most Popular
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
                  className={`w-full py-4 px-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Buy Now
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.5 16 12.4 16 13V16C16 17.4 15.4 18 14.8 18H9.2C8.6 18 8 17.4 8 16V13C8 12.4 8.6 11.5 9.2 11.5V10C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10V11.5H13.5V10C13.5 8.7 12.8 8.2 12 8.2Z"/>
                </svg>
              </div>
              <div className="text-white">
                <h4 className="font-bold text-lg mb-2">🔒 Bank-Grade Security</h4>
                <p className="text-gray-300 leading-relaxed">
                  Your payment is processed securely by Stripe with enterprise-level encryption. 
                  We never store your card information, and chips are added to your account instantly after payment.
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>PCI Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Instant Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}