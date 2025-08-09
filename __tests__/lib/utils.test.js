import {
  calculateCreditCost,
  hasEnoughCredits,
  formatCredits,
  formatCurrency,
  formatProcessingTime,
  calculateSuccessRate,
  getCreditTier,
} from '../../src/lib/utils';

describe('Utils Functions', () => {
  describe('calculateCreditCost', () => {
    test('calculates base cost for leadlove_maps', () => {
      expect(calculateCreditCost('leadlove_maps')).toBe(3);
    });

    test('scales cost based on maxResults', () => {
      expect(calculateCreditCost('leadlove_maps', { maxResults: 10 })).toBe(3);
      expect(calculateCreditCost('leadlove_maps', { maxResults: 20 })).toBe(3);
      expect(calculateCreditCost('leadlove_maps', { maxResults: 30 })).toBe(5);
      expect(calculateCreditCost('leadlove_maps', { maxResults: 50 })).toBe(8);
    });

    test('returns base cost for other tools', () => {
      expect(calculateCreditCost('email_generator')).toBe(1);
      expect(calculateCreditCost('business_analyzer')).toBe(1);
      expect(calculateCreditCost('competitor_analysis')).toBe(2);
    });

    test('returns 1 for unknown tools', () => {
      expect(calculateCreditCost('unknown_tool')).toBe(1);
    });
  });

  describe('hasEnoughCredits', () => {
    test('returns true when user has enough credits', () => {
      expect(hasEnoughCredits(100, 3)).toBe(true);
      expect(hasEnoughCredits(3, 3)).toBe(true);
    });

    test('returns false when user has insufficient credits', () => {
      expect(hasEnoughCredits(2, 3)).toBe(false);
      expect(hasEnoughCredits(0, 1)).toBe(false);
    });
  });

  describe('formatCredits', () => {
    test('formats credits with proper pluralization', () => {
      expect(formatCredits(0)).toBe('0 credits');
      expect(formatCredits(1)).toBe('1 credit');
      expect(formatCredits(2)).toBe('2 credits');
      expect(formatCredits(100)).toBe('100 credits');
      expect(formatCredits(1000)).toBe('1,000 credits');
    });
  });

  describe('formatCurrency', () => {
    test('formats cents to dollars', () => {
      expect(formatCurrency(1000)).toBe('$10');
      expect(formatCurrency(1050)).toBe('$10.50');
      expect(formatCurrency(99)).toBe('$0.99');
    });
  });

  describe('formatProcessingTime', () => {
    test('formats milliseconds correctly', () => {
      expect(formatProcessingTime(500)).toBe('500ms');
      expect(formatProcessingTime(1500)).toBe('1.5s');
      expect(formatProcessingTime(65000)).toBe('1m 5s');
      expect(formatProcessingTime(125000)).toBe('2m 5s');
    });
  });

  describe('calculateSuccessRate', () => {
    test('calculates success rate correctly', () => {
      expect(calculateSuccessRate(0, 0)).toBe(0);
      expect(calculateSuccessRate(10, 8)).toBe(80);
      expect(calculateSuccessRate(100, 95)).toBe(95);
    });
  });

  describe('getCreditTier', () => {
    test('returns correct tier based on credits used', () => {
      expect(getCreditTier(25)).toEqual({
        tier: 'Beginner',
        color: 'text-green-600 bg-green-50',
        description: 'Just getting started',
      });

      expect(getCreditTier(100)).toEqual({
        tier: 'Regular',
        color: 'text-blue-600 bg-blue-50',
        description: 'Building momentum',
      });

      expect(getCreditTier(300)).toEqual({
        tier: 'Pro',
        color: 'text-purple-600 bg-purple-50',
        description: 'Power user',
      });

      expect(getCreditTier(600)).toEqual({
        tier: 'Expert',
        color: 'text-orange-600 bg-orange-50',
        description: 'Lead generation master',
      });
    });
  });
});