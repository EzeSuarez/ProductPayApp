import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setStep, resetCheckout } from '../store/slices/checkoutSlice';
import { Product } from '../types';
import { formatCurrencyCOP } from '../utils/cardValidation';

interface StatusScreenProps {
  product: Product | null;
  onFinishCheckout: () => void;
}

export const StatusScreen: React.FC<StatusScreenProps> = ({
  product,
  onFinishCheckout,
}) => {
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((state) => state.checkout);
  const tx = checkout.transaction;

  const isApproved = tx?.status === 'APPROVED';
  const isDeclined = tx?.status === 'DECLINED';

  const handleRetry = () => {
    // Return to Step 2 so customer can enter another card
    dispatch(setStep(2));
  };

  const handleReturnToStore = () => {
    // Transitions to Step 5: updates store catalog and resets checkout
    onFinishCheckout();
  };

  return (
    <div
      role="region"
      aria-label="Transaction Status Result"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col p-6 space-y-6">
        {/* Status Icon & Header */}
        <div className="text-center space-y-3">
          {isApproved ? (
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
              Step 4 of 4 • Transaction Result
            </span>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
              {isApproved ? 'Payment Successful' : isDeclined ? 'Payment Declined' : 'Payment Error'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              {isApproved
                ? 'Your order has been verified and confirmed by the payment gateway.'
                : tx?.errorMessage ||
                  'The transaction was declined by the card issuer. Reserved stock has been restored.'}
            </p>
          </div>
        </div>

        {/* Transaction Details Box */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between border-b border-zinc-800/60 pb-2">
            <span className="text-zinc-500">Reference:</span>
            <span className="text-zinc-200 font-semibold">{tx?.reference || 'N/A'}</span>
          </div>

          {tx?.id && (
            <div className="flex justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-zinc-500">Transaction ID:</span>
              <span className="text-zinc-300 truncate max-w-[180px]">{tx.id}</span>
            </div>
          )}

          {isApproved && (
            <div className="flex justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-zinc-500">Tracking Number:</span>
              <span className="text-emerald-400 font-semibold">
                TRK-{Date.now().toString(36).toUpperCase().slice(-6)}
              </span>
            </div>
          )}

          <div className="flex justify-between border-b border-zinc-800/60 pb-2">
            <span className="text-zinc-500">Amount:</span>
            <span className="text-zinc-100 font-bold">
              {formatCurrencyCOP(tx?.amountInCents || (product ? product.priceInCents + 1500000 : 0))}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Status:</span>
            <span
              className={`font-semibold tracking-wide ${
                isApproved ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tx?.status || 'UNKNOWN'}
            </span>
          </div>
        </div>

        {/* Delivery Destination Reminder */}
        {isApproved && checkout.delivery.addressLine1 && (
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
              Shipping Address
            </span>
            <p className="text-zinc-200">
              {checkout.customer.fullName} • {checkout.delivery.addressLine1}, {checkout.delivery.city}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col space-y-2">
          {isApproved ? (
            <button
              id="return-to-store-btn"
              type="button"
              onClick={handleReturnToStore}
              className="w-full py-3 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold shadow-md active:scale-[0.98] transition-all"
            >
              Return to Store (Step 5: Updated Catalog) →
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleReturnToStore}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
              >
                Back to Store
              </button>
              <button
                id="retry-card-btn"
                type="button"
                onClick={handleRetry}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold shadow-md active:scale-95 transition-all"
              >
                Try Another Card →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
