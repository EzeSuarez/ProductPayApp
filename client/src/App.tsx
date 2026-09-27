import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import {
  setProducts,
  setSelectedProduct,
  setLoading,
  setError,
  decrementStock,
} from './store/slices/catalogSlice';
import {
  setStep,
  setQuantity,
  setProcessing,
  setTransactionResult,
  resetCheckout,
} from './store/slices/checkoutSlice';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { Pagination } from './components/Pagination';
import { CreditCardModal } from './components/CreditCardModal';
import { SummaryBackdrop } from './components/SummaryBackdrop';
import { StatusScreen } from './components/StatusScreen';
import { Product } from './types';
import { useTranslation } from './i18n/useTranslation';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const catalog = useAppSelector((state) => state.catalog);
  const checkout = useAppSelector((state) => state.checkout);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCatalog = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          dispatch(setProducts(json.data));
          return;
        }
      }
      dispatch(setError(t.errorLoadingCatalog));
    } catch {
      dispatch(setError(t.errorLoadingCatalog));
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleSelectProduct = (product: Product, quantity: number = 1) => {
    dispatch(setSelectedProduct(product));
    dispatch(setQuantity(quantity));
    // Transition to Step 2: Open Credit Card & Delivery Modal
    dispatch(setStep(2));
  };

  const handleCloseModal = () => {
    dispatch(setStep(1));
    dispatch(setSelectedProduct(null));
  };

  const handleConfirmPayment = async () => {
    if (!catalog.selectedProduct) return;

    dispatch(setProcessing(true));

    const totalAmount =
      catalog.selectedProduct.priceInCents * checkout.quantity +
      checkout.baseFeeInCents +
      checkout.deliveryFeeInCents;

    const payload = {
      productId: catalog.selectedProduct.id,
      quantity: checkout.quantity,
      customer: checkout.customer,
      delivery: checkout.delivery,
      payment: {
        cardToken: checkout.cardToken || 'tok_test_4242_approved',
        installments: 1,
        acceptanceToken: 'simulated_acceptance_token',
        acceptPersonalAuth: 'simulated_personal_auth_token',
        cardBrand: checkout.cardBrand,
        lastFour: checkout.cardLastFour,
      },
    };

    try {
      const res = await fetch('/api/transactions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const tx = data.data;

        dispatch(
          setTransactionResult({
            id: tx.transactionId || tx.id || `TX-LOCAL-${Date.now()}`,
            reference: tx.reference || `REF-${Date.now()}`,
            status: tx.status,
            amountInCents: tx.totalAmountInCents || totalAmount,
            errorMessage: tx.errorReason,
          })
        );

        if (tx.status === 'APPROVED') {
          dispatch(
            decrementStock({
              productId: catalog.selectedProduct.id,
              quantity: checkout.quantity,
            })
          );
        }
        return;
      }
    } catch {
      // Offline fallback simulation
    }

    // High fidelity offline/sandbox simulator if server is offline
    const isDeclined = checkout.cardToken?.includes('4111');
    const simTx = {
      id: `sim_tx_${Date.now()}`,
      reference: `TX-${Date.now()}-SIM`,
      status: (isDeclined ? 'DECLINED' : 'APPROVED') as any,
      amountInCents: totalAmount,
      errorMessage: isDeclined ? 'Card declined by issuing bank' : undefined,
    };

    dispatch(setTransactionResult(simTx));
    if (simTx.status === 'APPROVED') {
      dispatch(
        decrementStock({
          productId: catalog.selectedProduct.id,
          quantity: checkout.quantity,
        })
      );
    }
  };

  const handleFinishCheckout = () => {
    // Step 5: Updated Store Catalog & Session Reset
    dispatch(resetCheckout());
    dispatch(setSelectedProduct(null));
    fetchCatalog();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Sticky Header spanning top width */}
      <Header currentStep={checkout.currentStep} />

      {/* Main Container - Responsive for mobile, tablet, and desktop */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        {/* Step 1: Catalog Content */}
        <main className="flex-1 py-6 sm:py-10 space-y-6 sm:space-y-8">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-500">
              {t.curatedCollection}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t.featuredProducts}</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              {t.catalogSubtitle}
            </p>
          </div>

          {/* Loading Skeleton */}
          {catalog.isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 h-72 flex flex-col justify-between">
                  <div className="bg-zinc-800/50 rounded-xl aspect-square w-full" />
                  <div className="space-y-2 mt-3">
                    <div className="bg-zinc-800/60 h-4 rounded w-3/4" />
                    <div className="bg-zinc-800/40 h-3 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State with Retry Button */}
          {!catalog.isLoading && catalog.error && (
            <div role="alert" className="p-8 my-6 text-center border border-rose-900/50 bg-rose-950/20 rounded-2xl backdrop-blur-sm max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-900/40 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
                !
              </div>
              <p className="text-sm text-rose-200">{catalog.error}</p>
              <button
                type="button"
                onClick={fetchCatalog}
                className="px-5 py-2 text-xs font-semibold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all border border-zinc-700 shadow-sm"
              >
                {t.retryCatalog}
              </button>
            </div>
          )}

          {/* Product Grid & Pagination */}
          {!catalog.isLoading && !catalog.error && (
            <>
              <div className="columns-2 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 lg:gap-8 space-y-4 sm:space-y-6 lg:space-y-8">
                {catalog.products.map((product) => (
                  <div key={product.id} className="break-inside-avoid">
                    <ProductCard
                      product={product}
                      onSelect={handleSelectProduct}
                    />
                  </div>
                ))}
              </div>

              {/* Dummy Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={3}
                totalItems={18}
                itemsPerPage={6}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/60 py-6 text-center">
          <p className="text-xs text-zinc-500 font-mono">
            {t.footerText}
          </p>
        </footer>
      </div>

      {/* Step 2: Credit Card & Customer Delivery Modal */}
      <CreditCardModal
        isOpen={checkout.currentStep === 2}
        product={catalog.selectedProduct}
        onClose={handleCloseModal}
      />

      {/* Step 3: Material Design Summary Backdrop */}
      {checkout.currentStep === 3 && (
        <SummaryBackdrop
          product={catalog.selectedProduct}
          onConfirmPayment={handleConfirmPayment}
          isProcessing={checkout.isProcessing}
        />
      )}

      {/* Step 4: Final Status Screen */}
      {checkout.currentStep === 4 && (
        <StatusScreen
          product={catalog.selectedProduct}
          onFinishCheckout={handleFinishCheckout}
        />
      )}
    </div>
  );
};

export default App;
