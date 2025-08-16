import { DateUtils, DateParseOptions } from '../src/dedupe/utils';

describe('DateUtils', () => {
  describe('parseDate', () => {
    test('should parse ISO 8601 format', () => {
      const result = DateUtils.parseDate('2014-05-07T17:30:20+00:00');
      
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.format).toBe('ISO 8601');
      expect(result.date!.getFullYear()).toBe(2014);
      expect(result.date!.getMonth()).toBe(4); // May is month 4 (0-indexed)
      expect(result.date!.getDate()).toBe(7);
    });

    test('should parse ISO 8601 without timezone', () => {
      const result = DateUtils.parseDate('2014-05-07T17:30:20');
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('ISO 8601');
    });

    test('should parse Unix timestamp in seconds', () => {
      const result = DateUtils.parseDate('1399483820'); // 2014-05-07T17:30:20Z
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('Unix timestamp (seconds)');
    });

    test('should parse Unix timestamp in milliseconds', () => {
      const result = DateUtils.parseDate('1399483820000'); // 2014-05-07T17:30:20Z
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('Unix timestamp (milliseconds)');
    });

    test('should parse common date formats', () => {
      const formats = [
        '2014-05-07',
        '05/07/2014',
        '07/05/2014',
        '2014/05/07',
        '05-07-2014',
        '07-05-2014'
      ];

      formats.forEach(dateStr => {
        const result = DateUtils.parseDate(dateStr);
        expect(result.isValid).toBe(true);
        expect(result.date).toBeInstanceOf(Date);
      });
    });

    test('should handle empty string', () => {
      const result = DateUtils.parseDate('');
      
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error).toBe('Empty date string');
    });

    test('should handle invalid date format', () => {
      const result = DateUtils.parseDate('invalid-date');
      
      expect(result.isValid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error).toContain('Unable to parse date');
    });

    test('should use custom fallback formats', () => {
      const options: DateParseOptions = {
        fallbackFormats: ['dd.MM.yyyy']
      };
      
      const result = DateUtils.parseDate('07.05.2014', options);
      
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('Custom: dd.MM.yyyy');
    });
  });

  describe('isValidDate', () => {
    test('should return true for valid dates', () => {
      expect(DateUtils.isValidDate('2014-05-07T17:30:20+00:00')).toBe(true);
      expect(DateUtils.isValidDate('2014-05-07')).toBe(true);
      expect(DateUtils.isValidDate('1399483820')).toBe(true);
    });

    test('should return false for invalid dates', () => {
      expect(DateUtils.isValidDate('')).toBe(false);
      expect(DateUtils.isValidDate('invalid-date')).toBe(false);
      expect(DateUtils.isValidDate('not-a-date')).toBe(false);
    });
  });

  describe('formatToISO', () => {
    test('should format date to ISO string', () => {
      const date = new Date('2014-05-07T17:30:20.000Z');
      const result = DateUtils.formatToISO(date);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
    });
  });

  describe('getFormatDescription', () => {
    test('should return format description for valid dates', () => {
      expect(DateUtils.getFormatDescription('2014-05-07T17:30:20+00:00')).toBe('ISO 8601');
      expect(DateUtils.getFormatDescription('2014-05-07')).toBe('ISO 8601');
      expect(DateUtils.getFormatDescription('1399483820')).toBe('Unix timestamp (seconds)');
    });

    test('should return unknown for invalid dates', () => {
      expect(DateUtils.getFormatDescription('invalid-date')).toBe('Unknown format');
    });
  });

  describe('compareDates', () => {
    test('should compare dates correctly', () => {
      expect(DateUtils.compareDates('2014-05-07T17:30:20+00:00', '2014-05-07T17:31:20+00:00')).toBe(-1);
      expect(DateUtils.compareDates('2014-05-07T17:31:20+00:00', '2014-05-07T17:30:20+00:00')).toBe(1);
      expect(DateUtils.compareDates('2014-05-07T17:30:20+00:00', '2014-05-07T17:30:20+00:00')).toBe(0);
    });

    test('should handle different date formats', () => {
      expect(DateUtils.compareDates('2014-05-07', '2014-05-08')).toBe(-1);
      expect(DateUtils.compareDates('1399483820', '1399483880')).toBe(-1);
    });

    test('should return null for invalid dates', () => {
      expect(DateUtils.compareDates('invalid-date', '2014-05-07T17:30:20+00:00')).toBeNull();
      expect(DateUtils.compareDates('2014-05-07T17:30:20+00:00', 'invalid-date')).toBeNull();
      expect(DateUtils.compareDates('invalid-date', 'invalid-date')).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('should handle leap years', () => {
      const result = DateUtils.parseDate('2020-02-29');
      expect(result.isValid).toBe(true);
    });

    test('should handle DST transitions', () => {
      const result = DateUtils.parseDate('2023-03-12T02:00:00-05:00');
      expect(result.isValid).toBe(true);
    });

    test('should handle very old dates', () => {
      const result = DateUtils.parseDate('1900-01-01');
      expect(result.isValid).toBe(true);
    });

    test('should handle future dates', () => {
      const result = DateUtils.parseDate('2030-12-31T23:59:59+00:00');
      expect(result.isValid).toBe(true);
    });
  });
});
