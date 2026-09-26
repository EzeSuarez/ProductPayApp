import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setStep,
  updateCustomer,
  updateDelivery,
  setCardMetadata,
  setLegalAcceptance,
} from '../store/slices/checkoutSlice';
import {
  detectCardBrand,
  validateLuhn,
  formatCardNumber,
  formatExpiry,
} from '../utils/cardValidation';
import { Product } from '../types';
import { useTranslation } from '../i18n/useTranslation';

interface CreditCardModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const CreditCardModal: React.FC<CreditCardModalProps> = ({
  isOpen,
  product,
  onClose,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((state) => state.checkout);

  // Form local state (PAN and CVV are strictly ephemeral and never stored in Redux/localStorage)
  const [fullName, setFullName] = useState(checkout.customer.fullName || '');
  const [email, setEmail] = useState(checkout.customer.email || '');
  const [phoneNumber, setPhoneNumber] = useState(checkout.customer.phoneNumber || '');
  const [legalId, setLegalId] = useState(checkout.customer.legalId || '');

  const [addressLine1, setAddressLine1] = useState(checkout.delivery.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(checkout.delivery.addressLine2 || '');
  const [city, setCity] = useState(checkout.delivery.city || 'Bogotá D.C.');
  const [region, setRegion] = useState(checkout.delivery.region || 'Cundinamarca');
  const [postalCode, setPostalCode] = useState(checkout.delivery.postalCode || '110111');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(checkout.customer.fullName || '');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [installments, setInstallments] = useState(1);

  const [termsAccepted, setTermsAccepted] = useState(checkout.termsAccepted);
  const [personalAuthAccepted, setPersonalAuthAccepted] = useState(checkout.personalAuthAccepted);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !product) return null;

  const cardBrand = detectCardBrand(cardNumber);
  const rawCardDigits = cardNumber.replace(/\D/g, '');
  const isLuhnValid = rawCardDigits.length >= 13 ? validateLuhn(rawCardDigits) : null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setExpiry(formatted);
    if (errors.expiry) {
      setErrors((prev) => ({ ...prev, expiry: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = t.errorFullNameRequired;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.errorEmailInvalid;
    }
    if (!phoneNumber.trim()) newErrors.phoneNumber = t.errorPhoneRequired;
    if (!addressLine1.trim()) newErrors.addressLine1 = t.errorAddressRequired;
    if (!city.trim()) newErrors.city = t.errorCityRequired;

    if (!rawCardDigits || rawCardDigits.length < 13) {
      newErrors.cardNumber = t.errorCardDigits;
    } else if (!validateLuhn(rawCardDigits)) {
      newErrors.cardNumber = t.errorCardLuhn;
    }

    if (!cardHolder.trim()) newErrors.cardHolder = t.errorCardHolderRequired;

    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    if (!monthStr || !yearStr || isNaN(month) || month < 1 || month > 12 || yearStr.length < 2) {
      newErrors.expiry = t.errorExpiryInvalid;
    }

    if (!cvc.trim() || cvc.length < 3 || cvc.length > 4) {
      newErrors.cvc = t.errorCvcInvalid;
    }

    if (!termsAccepted) {
      newErrors.terms = t.errorTermsRequired;
    }

    if (!personalAuthAccepted) {
      newErrors.personalAuth = t.errorPrivacyRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // 1. Update Redux customer & delivery
    dispatch(
      updateCustomer({
        fullName,
        email,
        phoneNumber,
        legalId,
      })
    );

    dispatch(
      updateDelivery({
        addressLine1,
        addressLine2,
        city,
        region,
        postalCode,
      })
    );

    // 2. Tokenize card or assign sandbox token (Zero-PCI compliance: raw card is never sent to backend)
    const lastFour = rawCardDigits.slice(-4);
    let sandboxToken = `tok_test_${rawCardDigits.startsWith('4111') ? '4111_declined' : '4242_approved'}_${Date.now()}`;

    dispatch(
      setCardMetadata({
        brand: cardBrand,
        lastFour,
        token: sandboxToken,
      })
    );

    dispatch(
      setLegalAcceptance({
        termsAccepted,
        personalAuthAccepted,
      })
    );

    // 3. Move to Step 3 (Summary Backdrop)
    dispatch(setStep(3));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
              {t.step2Subtitle}
            </span>
            <h2 id="modal-title" className="text-base font-semibold text-zinc-100">
              {t.modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeModalAria}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected Product summary snippet */}
        <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-800/60 flex items-center space-x-3">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-12 h-12 object-cover rounded-lg border border-zinc-800"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium text-zinc-200 truncate">{product.name}</h3>
            <p className="text-xs text-zinc-400 font-mono">{t.stockReservedOne}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Customer Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
              <span>{t.customerSection}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="customer-fullName" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.fullNameLabel}
                </label>
                <input
                  id="customer-fullName"
                  type="text"
                  required
                  placeholder={t.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                    errors.fullName ? 'border-rose-500' : 'border-zinc-800'
                  }`}
                />
                {errors.fullName && <p className="text-[10px] text-rose-400 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="customer-email" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.emailLabel}
                </label>
                <input
                  id="customer-email"
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                    errors.email ? 'border-rose-500' : 'border-zinc-800'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="customer-phone" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.phoneLabel}
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  placeholder={t.phonePlaceholder}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                    errors.phoneNumber ? 'border-rose-500' : 'border-zinc-800'
                  }`}
                />
                {errors.phoneNumber && <p className="text-[10px] text-rose-400 mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label htmlFor="customer-legalId" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.legalIdLabel}
                </label>
                <input
                  id="customer-legalId"
                  type="text"
                  placeholder={t.legalIdPlaceholder}
                  value={legalId}
                  onChange={(e) => setLegalId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Delivery Details */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t.deliverySection}
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="delivery-address1" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.addressLine1Label}
                </label>
                <input
                  id="delivery-address1"
                  type="text"
                  required
                  placeholder={t.addressLine1Placeholder}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                    errors.addressLine1 ? 'border-rose-500' : 'border-zinc-800'
                  }`}
                />
                {errors.addressLine1 && <p className="text-[10px] text-rose-400 mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label htmlFor="delivery-address2" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.addressLine2Label}
                </label>
                <input
                  id="delivery-address2"
                  type="text"
                  placeholder={t.addressLine2Placeholder}
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="delivery-city" className="text-[11px] font-medium text-zinc-300 block mb-1">
                    {t.cityLabel}
                  </label>
                  <input
                    id="delivery-city"
                    type="text"
                    required
                    placeholder={t.cityPlaceholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="delivery-region" className="text-[11px] font-medium text-zinc-300 block mb-1">
                    {t.regionLabel}
                  </label>
                  <input
                    id="delivery-region"
                    type="text"
                    placeholder={t.regionPlaceholder}
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="delivery-postalCode" className="text-[11px] font-medium text-zinc-300 block mb-1">
                    {t.postalCodeLabel}
                  </label>
                  <input
                    id="delivery-postalCode"
                    type="text"
                    placeholder={t.postalCodePlaceholder}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Credit Card Information */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t.cardSection}
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">{t.zeroPciBadge}</span>
            </div>

            <div className="space-y-3">
              {/* Card Number & Brand Detection */}
              <div>
                <label htmlFor="card-number" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.cardNumberLabel}
                </label>
                <div className="relative">
                  <input
                    id="card-number"
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder={t.cardNumberPlaceholder}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    className={`w-full pl-3 pr-24 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                      errors.cardNumber ? 'border-rose-500' : 'border-zinc-800'
                    }`}
                  />
                  {/* Brand Logo Display */}
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                    {cardBrand === 'VISA' && (
                      <span
                        data-testid="visa-badge"
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60 tracking-wider"
                      >
                        VISA
                      </span>
                    )}
                    {cardBrand === 'MASTERCARD' && (
                      <span
                        data-testid="mastercard-badge"
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 tracking-wider flex items-center space-x-1"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 opacity-90 inline-block -mr-1" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 opacity-90 inline-block" />
                        <span>MC</span>
                      </span>
                    )}
                    {isLuhnValid === true && (
                      <span title="Valid card structure" className="text-emerald-400 text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                {errors.cardNumber && <p className="text-[10px] text-rose-400 mt-1">{errors.cardNumber}</p>}
                {/* Sandbox test tips */}
                <p className="text-[10px] text-zinc-500 mt-1">
                  {t.sandboxCardsTip} <span className="font-mono text-zinc-400">{t.sandboxCardsApproved}</span> •{' '}
                  <span className="font-mono text-zinc-400">{t.sandboxCardsDeclined}</span>
                </p>
              </div>

              {/* Cardholder Name */}
              <div>
                <label htmlFor="card-holder" className="text-[11px] font-medium text-zinc-300 block mb-1">
                  {t.cardHolderLabel}
                </label>
                <input
                  id="card-holder"
                  type="text"
                  required
                  placeholder={t.cardHolderPlaceholder}
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                    errors.cardHolder ? 'border-rose-500' : 'border-zinc-800'
                  }`}
                />
                {errors.cardHolder && <p className="text-[10px] text-rose-400 mt-1">{errors.cardHolder}</p>}
              </div>

              {/* Expiry, CVC & Installments */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="card-expiry" className="text-[11px] font-medium text-zinc-300 block mb-1">
                    {t.expiryLabel}
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    required
                    placeholder={t.expiryPlaceholder}
                    maxLength={5}
                    value={expiry}
                    onChange={handleExpiryChange}
                    className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 font-mono text-center focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                      errors.expiry ? 'border-rose-500' : 'border-zinc-800'
                    }`}
                  />
                  {errors.expiry && <p className="text-[10px] text-rose-400 mt-1">{errors.expiry}</p>}
                </div>

                <div>
                  <label htmlFor="card-cvc" className="text-[11px] font-medium text-zinc-300 block mb-1">
                    {t.cvcLabel}
                  </label>
                  <input
                    id="card-cvc"
                    type="password"
                    required
                    maxLength={4}
                    placeholder={t.cvcPlaceholder}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-xs text-zinc-100 font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                      errors.cvc ? 'border-rose-500' : 'border-zinc-800'
                    }`}
                  />
                  {errors.cvc && <p className="text-[10px] text-rose-400 mt-1">{errors.cvc}</p>}
                </div>

                <div>
                  <label htmlFor="card-installments" className="text-[11px] font-medium text-zinc-300 block mb-1">
                    {t.installmentsLabel}
                  </label>
                  <select
                    id="card-installments"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full px-2 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                  >
                    {[1, 2, 3, 6, 12, 24, 36].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? t.cuotaSingular : t.cuotasPlural}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Acceptance Checkboxes */}
          <section className="pt-2 border-t border-zinc-800/80 space-y-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                id="checkbox-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-zinc-100 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[11px] text-zinc-400 leading-tight">
                {t.termsAcceptancePart1}
                <a
                  href="#terms"
                  className="text-zinc-200 underline hover:text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  {t.termsAcceptanceLink}
                </a>
                {t.termsAcceptancePart2}
              </span>
            </label>
            {errors.terms && <p className="text-[10px] text-rose-400">{errors.terms}</p>}

            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                id="checkbox-privacy"
                type="checkbox"
                checked={personalAuthAccepted}
                onChange={(e) => setPersonalAuthAccepted(e.target.checked)}
                className="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-zinc-100 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[11px] text-zinc-400 leading-tight">
                {t.privacyAcceptancePart1}
                <a
                  href="#privacy"
                  className="text-zinc-200 underline hover:text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  {t.privacyAcceptanceLink}
                </a>
                {t.privacyAcceptancePart2}
              </span>
            </label>
            {errors.personalAuth && <p className="text-[10px] text-rose-400">{errors.personalAuth}</p>}
          </section>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 text-xs font-medium transition-colors"
            >
              {t.cancelBtn}
            </button>
            <button
              id="continue-to-summary-btn"
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              {t.continueToSummaryBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
