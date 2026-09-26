import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setStep } from '../store/slices/checkoutSlice';
import { Product } from '../types';
import { formatCurrencyCOP } from '../utils/cardValidation';
import { useTranslation } from '../i18n/useTranslation';

interface SummaryBackdropProps {
  product: Product | null;
  onConfirmPayment: () => void;
  isProcessing: boolean;
}

export const SummaryBackdrop: React.FC<SummaryBackdropProps> = ({
  product,
  onConfirmPayment,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((state) => state.checkout);

  if (!product) return null;

  const productPrice = product.priceInCents;
  const baseFee = checkout.baseFeeInCents;
  const deliveryFee = checkout.deliveryFeeInCents;
  const grandTotal = productPrice + baseFee + deliveryFee;

  return (
    <div
      role="region"
      aria-label="Order Summary and Payment Confirmation"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Step Indicator Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
              {t.step3Subtitle}
            </span>
            <h2 className="text-base font-semibold text-zinc-100">{t.orderSummaryTitle}</h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setStep(2))}
            disabled={isProcessing}
            className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center space-x-1 p-1 rounded transition-colors"
          >
            <span>{t.editInfoBtn}</span>
          </button>
        </div>

        {/* BACK LAYER: Itemized Breakdown & Destination */}
        <div className="p-5 bg-zinc-950/60 border-b border-zinc-800/80 space-y-4">
          {/* Product Row */}
          <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800/50">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl border border-zinc-800"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-zinc-100 truncate">{product.name}</h3>
              <p className="text-[11px] text-zinc-400 font-mono">{t.qtyOneItem}</p>
              <p className="text-xs font-medium text-zinc-300 mt-0.5">
                {formatCurrencyCOP(productPrice)}
              </p>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>{t.subtotalProduct}</span>
              <span className="font-mono text-zinc-200">{formatCurrencyCOP(productPrice)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span className="flex items-center space-x-1">
                <span>{t.platformBaseFee}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{t.gatewaySecuritySubtext}</span>
              </span>
              <span className="font-mono text-zinc-200">{formatCurrencyCOP(baseFee)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>{t.expressDeliveryFee}</span>
              <span className="font-mono text-zinc-200">{formatCurrencyCOP(deliveryFee)}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 flex justify-between font-semibold text-sm text-zinc-100">
              <span>{t.grandTotalLabel}</span>
              <span className="font-bold text-zinc-50 font-mono">{formatCurrencyCOP(grandTotal)}</span>
            </div>
          </div>

          {/* Customer & Delivery Destination Card */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-semibold text-zinc-300">{t.recipientLabel}</span>
              <span>{checkout.customer.fullName}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-semibold text-zinc-300">{t.deliveryAddressLabel}</span>
              <span className="truncate max-w-[200px]">
                {checkout.delivery.addressLine1}, {checkout.delivery.city}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-semibold text-zinc-300">{t.paymentMethodLabel}</span>
              <span className="font-mono text-zinc-200">
                {checkout.cardBrand} •••• {checkout.cardLastFour || '4242'}
              </span>
            </div>
          </div>
        </div>

        {/* FRONT LAYER: Prominent Active Payment Layer */}
        <div className="p-5 bg-zinc-900 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
              {t.totalToPay}
            </span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {formatCurrencyCOP(grandTotal)}
            </span>
          </div>

          <button
            id="confirm-pay-btn"
            type="button"
            disabled={isProcessing}
            onClick={onConfirmPayment}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all duration-200 ${
              isProcessing
                ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{t.processingPaymentBtn}</span>
              </>
            ) : (
              <>
                <span>{t.confirmAndPayBtn} ({formatCurrencyCOP(grandTotal)})</span>
                <span>→</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-zinc-500 font-mono">
            {t.encryptedHashNotice}
          </p>
        </div>
      </div>
    </div>
  );
};
