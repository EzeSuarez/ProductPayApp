import React, { useState } from 'react';
import { Product } from '../types';
import { formatCurrencyCOP } from '../utils/cardValidation';
import { useTranslation } from '../i18n/useTranslation';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, quantity?: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = product.stock <= 0;

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((prev) => Math.min(product.stock, prev + 1));
  };

  const handleSelect = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isOutOfStock) {
      if (quantity > 1) {
        onSelect(product, quantity);
      } else {
        onSelect(product);
      }
    }
  };

  return (
    <article
      data-testid={`product-card-${product.id}`}
      onClick={handleSelect}
      className={`group relative bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-600/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99] backdrop-blur-sm ${
        isOutOfStock ? 'opacity-75 cursor-not-allowed hover:translate-y-0 hover:border-zinc-800/80' : ''
      }`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/3.8] sm:aspect-square w-full overflow-hidden bg-zinc-950">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Subtle Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Live Status Badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
          {isOutOfStock ? (
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-wide bg-rose-950/80 text-rose-300 border border-rose-800/50 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {t.soldOut}
            </span>
          ) : (
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono tracking-wide bg-zinc-950/70 text-zinc-300 border border-white/10 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-sm group-hover:border-emerald-500/40 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              {t.stock(product.stock)}
            </span>
          )}
        </div>
      </div>

      {/* Product Details & Action Bar */}
      <div className="p-3 sm:p-4.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-white line-clamp-1 tracking-tight transition-colors">
            {product.name}
          </h2>
          <p className="mt-1 text-[11px] sm:text-xs text-zinc-400 line-clamp-2 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Price & Modern CTA Bar */}
        <div className="pt-2.5 sm:pt-3 border-t border-zinc-800/60 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              {t.price}
            </span>
            <div className="text-right">
              <span className="text-xs sm:text-sm md:text-base font-bold text-zinc-50 tracking-tight">
                {formatCurrencyCOP(product.priceInCents * quantity)}
              </span>
              {quantity > 1 && (
                <span className="text-[10px] text-zinc-400 block font-mono">
                  {quantity} × {formatCurrencyCOP(product.priceInCents)}
                </span>
              )}
            </div>
          </div>

          {/* 50 / 50 Row: Quantity Stepper & Buy Button */}
          <div className="flex items-center gap-2 w-full">
            {/* Quantity Stepper (50% width) */}
            <div
              className={`flex-1 w-1/2 flex items-center justify-between h-8.5 sm:h-9 rounded-full bg-zinc-800/90 border border-zinc-700/60 px-2 sm:px-3 ${
                isOutOfStock ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <button
                type="button"
                aria-label={t.decreaseQuantityAria}
                disabled={isOutOfStock || quantity <= 1}
                onClick={handleDecrease}
                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700/80 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold outline-none focus:outline-none focus:ring-0"
              >
                −
              </button>
              <span
                data-testid={`quantity-value-${product.id}`}
                className="text-xs font-mono font-semibold text-zinc-100 select-none px-1"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label={t.increaseQuantityAria}
                disabled={isOutOfStock || quantity >= product.stock}
                onClick={handleIncrease}
                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700/80 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold outline-none focus:outline-none focus:ring-0"
              >
                +
              </button>
            </div>

            {/* Buy Button (50% width) */}
            <button
              id={`pay-button-${product.id}`}
              type="button"
              aria-label={t.payWithCard}
              disabled={isOutOfStock}
              onClick={handleSelect}
              className={`group/btn relative overflow-hidden flex-1 w-1/2 h-8.5 sm:h-9 px-2 sm:px-3 rounded-full text-[11px] sm:text-xs font-semibold tracking-tight transition-all duration-300 flex items-center justify-center gap-1 shadow-sm active:scale-90 active:bg-zinc-200 ${
                isOutOfStock
                  ? 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 cursor-not-allowed'
                  : 'bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.03] hover:shadow-[0_0_22px_rgba(255,255,255,0.45)] cursor-pointer'
              }`}
            >
              {/* Shimmer Light Beam Effect across the button on hover */}
              {!isOutOfStock && (
                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
              )}

              {/* Credit Card Icon with interactive tilt & scale on hover */}
              <svg
                className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover/btn:-rotate-12 group-hover/btn:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>

              {/* Accessible label for screen readers & tests (single unique instance) */}
              <span className="sr-only">{t.payWithCard}</span>

              {/* Visual label */}
              <span aria-hidden="true" className="whitespace-nowrap transition-colors duration-200">
                {t.buy}
              </span>

              {/* Micro chevron arrow with slide animation on hover */}
              <svg
                className="w-3 h-3 shrink-0 opacity-70 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:opacity-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
