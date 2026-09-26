import {
  detectCardBrand,
  validateLuhn,
  formatCardNumber,
  formatExpiry,
  formatCurrencyCOP,
} from './cardValidation';

describe('cardValidation utilities', () => {
  describe('detectCardBrand', () => {
    it('should detect VISA when number starts with 4', () => {
      expect(detectCardBrand('4242424242424242')).toBe('VISA');
      expect(detectCardBrand('4111 1111 1111 1111')).toBe('VISA');
      expect(detectCardBrand('4')).toBe('VISA');
    });

    it('should detect MASTERCARD for 51-55 and 2221-2720 prefixes', () => {
      expect(detectCardBrand('5555555555554444')).toBe('MASTERCARD');
      expect(detectCardBrand('5105105105105100')).toBe('MASTERCARD');
      expect(detectCardBrand('2221000000000000')).toBe('MASTERCARD');
    });

    it('should return UNKNOWN for unsupported cards or random prefixes', () => {
      expect(detectCardBrand('378282246310005')).toBe('UNKNOWN'); // Amex
      expect(detectCardBrand('6011000000000000')).toBe('UNKNOWN'); // Discover
      expect(detectCardBrand('')).toBe('UNKNOWN');
    });
  });

  describe('validateLuhn', () => {
    it('should return true for valid Luhn numbers', () => {
      expect(validateLuhn('4242 4242 4242 4242')).toBe(true);
      expect(validateLuhn('4111 1111 1111 1111')).toBe(true);
    });

    it('should return false for invalid Luhn numbers', () => {
      expect(validateLuhn('4242 4242 4242 4243')).toBe(false);
      expect(validateLuhn('1234567812345671')).toBe(false);
    });

    it('should return false for card numbers outside 13-19 digits', () => {
      expect(validateLuhn('123456')).toBe(false);
      expect(validateLuhn('')).toBe(false);
    });
  });

  describe('formatCardNumber', () => {
    it('should group digits into blocks of 4 separated by space', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
      expect(formatCardNumber('4242')).toBe('4242');
      expect(formatCardNumber('42424')).toBe('4242 4');
    });

    it('should cap at 16 digits', () => {
      expect(formatCardNumber('12345678123456789999')).toBe('1234 5678 1234 5678');
    });
  });

  describe('formatExpiry', () => {
    it('should insert slash after 2 digits', () => {
      expect(formatExpiry('1228')).toBe('12/28');
      expect(formatExpiry('12')).toBe('12');
      expect(formatExpiry('1')).toBe('1');
    });
  });

  describe('formatCurrencyCOP', () => {
    it('should format cents into COP currency representation', () => {
      const formatted = formatCurrencyCOP(145000000);
      expect(formatted).toContain('1.450.000');
    });
  });
});
