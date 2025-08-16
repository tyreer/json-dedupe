import { LeadRecord, LeadRecordData } from '../src/dedupe/models';

describe('LeadRecord', () => {
  describe('constructor', () => {
    test('should create a valid record with all fields', () => {
      const data: LeadRecordData = {
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St'
      };

      const record = new LeadRecord(data);

      expect(record._id).toBe('test123');
      expect(record.email).toBe('test@example.com');
      expect(record.entryDate).toBe('2014-05-07T17:30:20+00:00');
      expect(record.firstName).toBe('John');
      expect(record.lastName).toBe('Doe');
      expect(record.address).toBe('123 Main St');
    });

    test('should create a record with only required fields', () => {
      const data: LeadRecordData = {
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      };

      const record = new LeadRecord(data);

      expect(record._id).toBe('test123');
      expect(record.email).toBe('test@example.com');
      expect(record.entryDate).toBe('2014-05-07T17:30:20+00:00');
      expect(record.firstName).toBeUndefined();
      expect(record.lastName).toBeUndefined();
      expect(record.address).toBeUndefined();
    });
  });

  describe('date parsing', () => {
    test('should parse valid ISO 8601 date', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      expect(record.hasValidDate()).toBe(true);
      expect(record.getParsedDate()).toBeInstanceOf(Date);
    });

    test('should handle invalid date format', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: 'invalid-date'
      });

      expect(record.hasValidDate()).toBe(false);
      expect(record.getParsedDate()).toBeNull();
    });

    test('should handle empty date string', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: ''
      });

      expect(record.hasValidDate()).toBe(false);
      expect(record.getParsedDate()).toBeNull();
    });

    test('should handle null date', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: null as any
      });

      expect(record.hasValidDate()).toBe(false);
      expect(record.getParsedDate()).toBeNull();
    });
  });

  describe('validation', () => {
    test('should validate a complete valid record', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const result = record.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing _id field', () => {
      const record = new LeadRecord({
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      } as LeadRecordData);

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or empty _id field');
    });

    test('should detect empty _id field', () => {
      const record = new LeadRecord({
        _id: '',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or empty _id field');
    });

    test('should detect missing email field', () => {
      const record = new LeadRecord({
        _id: 'test123',
        entryDate: '2014-05-07T17:30:20+00:00'
      } as LeadRecordData);

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or empty email field');
    });

    test('should detect empty email field', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: '',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or empty email field');
    });

    test('should detect missing entryDate field', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com'
      } as LeadRecordData);

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or empty entryDate field');
    });

    test('should detect empty entryDate field', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: ''
      });

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or empty entryDate field');
    });

    test('should detect invalid date format', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: 'invalid-date'
      });

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format: invalid-date');
    });

    test('should collect multiple validation errors', () => {
      const record = new LeadRecord({
        _id: '',
        email: '',
        entryDate: 'invalid-date'
      });

      const result = record.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Missing or empty _id field');
      expect(result.errors).toContain('Missing or empty email field');
      expect(result.errors).toContain('Invalid date format: invalid-date');
    });
  });

  describe('toString', () => {
    test('should return string representation', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const result = record.toString();

      expect(result).toBe('LeadRecord(_id: test123, email: test@example.com, entryDate: 2014-05-07T17:30:20+00:00)');
    });
  });

  describe('toObject', () => {
    test('should return plain object representation', () => {
      const data: LeadRecordData = {
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St'
      };

      const record = new LeadRecord(data);
      const result = record.toObject();

      expect(result).toEqual(data);
    });
  });

  describe('compareByDate', () => {
    test('should compare dates correctly - this record is older', () => {
      const olderRecord = new LeadRecord({
        _id: 'old',
        email: 'old@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const newerRecord = new LeadRecord({
        _id: 'new',
        email: 'new@example.com',
        entryDate: '2014-05-07T17:31:20+00:00'
      });

      const result = olderRecord.compareByDate(newerRecord);

      expect(result).toBe(-1);
    });

    test('should compare dates correctly - this record is newer', () => {
      const olderRecord = new LeadRecord({
        _id: 'old',
        email: 'old@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const newerRecord = new LeadRecord({
        _id: 'new',
        email: 'new@example.com',
        entryDate: '2014-05-07T17:31:20+00:00'
      });

      const result = newerRecord.compareByDate(olderRecord);

      expect(result).toBe(1);
    });

    test('should compare dates correctly - same date', () => {
      const record1 = new LeadRecord({
        _id: 'first',
        email: 'first@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const record2 = new LeadRecord({
        _id: 'second',
        email: 'second@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const result = record1.compareByDate(record2);

      expect(result).toBe(0);
    });

    test('should handle invalid dates in comparison', () => {
      const validRecord = new LeadRecord({
        _id: 'valid',
        email: 'valid@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const invalidRecord = new LeadRecord({
        _id: 'invalid',
        email: 'invalid@example.com',
        entryDate: 'invalid-date'
      });

      const result = validRecord.compareByDate(invalidRecord);

      expect(result).toBe(0);
    });
  });
});
