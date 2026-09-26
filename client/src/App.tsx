import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import {
  setProducts,
  setSelectedProduct,
  setLoading,
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

// Curated dummy products matching backend seeds
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Sony WH-1000XM5 Wireless Headphones (Midnight Black)',
    description:
      'Industry-leading noise canceling with Auto NC Optimizer, crystal clear hands-free calling, and 30-hour battery life.',
    priceInCents: 145000000,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  },
  {
    id: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    name: 'Apple Watch Series 9 GPS 45mm (Space Black)',
    description:
      'Smarter, brighter, and mightier. Double tap gesture, S9 SiP chip, and advanced health sensors.',
    priceInCents: 215000000,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  },
  {
    id: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f',
    name: 'Minimalist Leather Travel Backpack (Matte Black)',
    description:
      'Water-resistant full-grain leather, padded 16-inch laptop compartment, and ergonomic shoulder straps.',
    priceInCents: 38000000,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  },
  {
    id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    name: 'Keychron K2 Pro Mechanical Keyboard',
    description:
      'Wireless QMK/VIA custom mechanical keyboard, RGB backlighting, hot-swappable switches, sound-absorbing foam.',
    priceInCents: 52000000,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    name: 'Fujifilm X100V Digital Camera (Silver & Black)',
    description:
      '26.1MP APS-C X-Trans BSI CMOS sensor, fixed 23mm f/2 lens, hybrid optical/electronic viewfinder, 4K video.',
    priceInCents: 689000000,
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  },
  {
    id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    name: 'Hario V60 Ceramic Drip Set (Monochrome Edition)',
    description:
      'Classic pour-over brewer with heatproof glass server, measurement scale, and ergonomic kettle spout.',
    priceInCents: 19500000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
  },
];

export const App: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const catalog = useAppSelector((state) => state.catalog);
  const checkout = useAppSelector((state) => state.checkout);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCatalog = async () => {
    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          dispatch(setProducts(json.data));
          return;
        }
      }
    } catch {
      // Backend not yet running or network unavailable in standalone test
    }
    dispatch(setProducts(FALLBACK_PRODUCTS));
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

          {/* Product Grid: Masonry Layout (2 cols mobile, 2 cols tablet, 3 cols desktop) */}
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
