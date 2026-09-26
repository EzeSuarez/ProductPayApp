import React from 'react';
import { Product } from '../types';
import { formatCurrencyCOP } from '../utils/cardValidation';
import { useTranslation } from '../i18n/useTranslation';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { t } = useTranslation();
  const isOutOfStock = product.stock <= 0;

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:border-zinc-700/80 hover:shadow-zinc-950/50 flex flex-col justify-between"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-rose-950/80 text-rose-300 border border-rose-800/50 rounded-full backdrop-blur-md">
              {t.soldOut}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-black/70 text-zinc-300 border border-zinc-700/50 rounded-full backdrop-blur-md">
              {t.stock(product.stock)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 line-clamp-1">
            {product.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
              {t.price}
            </span>
            <span className="text-base font-bold text-zinc-50 tracking-tight">
              {formatCurrencyCOP(product.priceInCents)}
            </span>
          </div>

          <button
            id={`pay-button-${product.id}`}
            type="button"
            disabled={isOutOfStock}
            onClick={() => onSelect(product)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center space-x-1.5 shadow-sm active:scale-95 ${
              isOutOfStock
                ? 'bg-zinc-800/60 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white hover:shadow-zinc-200/10'
            }`}
          >
            <span>{t.payWithCard}</span>
            <svg
              className="w-3.5 h-3.5"
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
    </article>
  );
};
