import { CardBrand } from '../types';

export const detectCardBrand = (cardNumber: string): CardBrand => {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (/^4[0-9]{0,15}$/.test(sanitized)) return 'VISA';
  if (
    /^(5[1-5][0-9]{0,14}|2(22[1-9][0-9]{0,12}|2[3-9][0-9]{0,13}|[3-6][0-9]{0,14}|7[0-1][0-9]{0,13}|720[0-9]{0,12}))$/.test(
      sanitized
    )
  ) {
    return 'MASTERCARD';
  }
  return 'UNKNOWN';
};

export const validateLuhn = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (sanitized.length < 13 || sanitized.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const formatCardNumber = (value: string): string => {
  const sanitized = value.replace(/\D/g, '').slice(0, 16);
  return sanitized.replace(/(\d{4})/g, '$1 ').trim();
};

export const formatExpiry = (value: string): string => {
  const sanitized = value.replace(/\D/g, '').slice(0, 4);
  if (sanitized.length >= 3) {
    return `${sanitized.slice(0, 2)}/${sanitized.slice(2, 4)}`;
  }
  return sanitized;
};

export const formatCurrencyCOP = (amountInCents: number): string => {
  const wholeUnits = Math.floor(amountInCents / 100);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(wholeUnits);
};
