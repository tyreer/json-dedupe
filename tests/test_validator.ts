import { RecordValidator } from '../src/dedupe/validator';
import { LeadRecord } from '../src/dedupe/models';

describe('RecordValidator', () => {
  let validator: RecordValidator;

  beforeEach(() => {
    validator = RecordValidator.createDefaultValidator();
  });

  describe('validateRecord', () => {
    test('should validate a complete valid record', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(0);
    });

    test('should detect missing _id field', () => {
      const record = new LeadRecord({
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      } as any);

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.type).toBe('missing_field');
      expect(errors[0]!.field).toBe('_id');
      expect(errors[0]!.message).toContain('Missing required field: _id');
    });

    test('should detect missing email field', () => {
      const record = new LeadRecord({
        _id: 'test123',
        entryDate: '2014-05-07T17:30:20+00:00'
      } as any);

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.type).toBe('missing_field');
      expect(errors[0]!.field).toBe('email');
    });

    test('should detect missing entryDate field', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com'
      } as any);

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.type).toBe('missing_field');
      expect(errors[0]!.field).toBe('entryDate');
    });

    test('should detect empty string values', () => {
      const record = new LeadRecord({
        _id: '',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.type).toBe('empty_value');
      expect(errors[0]!.field).toBe('_id');
    });

    test('should detect invalid date format', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: 'invalid-date'
      });

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.type).toBe('invalid_date');
      expect(errors[0]!.field).toBe('entryDate');
      expect(errors[0]!.message).toContain('Invalid date format');
    });

    test('should collect multiple errors for a single record', () => {
      const record = new LeadRecord({
        _id: '',
        email: '',
        entryDate: 'invalid-date'
      });

      const errors = validator.validateRecord(record);

      expect(errors).toHaveLength(3);
      expect(errors.some(e => e.type === 'empty_value' && e.field === '_id')).toBe(true);
      expect(errors.some(e => e.type === 'empty_value' && e.field === 'email')).toBe(true);
      expect(errors.some(e => e.type === 'invalid_date' && e.field === 'entryDate')).toBe(true);
    });

    test('should include record index and ID in errors', () => {
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: 'invalid-date'
      });

      const errors = validator.validateRecord(record, 5);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.recordIndex).toBe(5);
      expect(errors[0]!.recordId).toBe('test123');
    });
  });

  describe('validateRecords', () => {
    test('should validate multiple records successfully', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test2',
          email: 'test2@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      const summary = validator.validateRecords(records);

      expect(summary.isValid).toBe(true);
      expect(summary.totalRecords).toBe(2);
      expect(summary.validRecords).toBe(2);
      expect(summary.invalidRecords).toBe(0);
      expect(summary.errors).toHaveLength(0);
    });

    test('should handle mixed valid and invalid records', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test2',
          email: '',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'test3',
          email: 'test3@example.com',
          entryDate: 'invalid-date'
        })
      ];

      const summary = validator.validateRecords(records);

      expect(summary.isValid).toBe(false);
      expect(summary.totalRecords).toBe(3);
      expect(summary.validRecords).toBe(1);
      expect(summary.invalidRecords).toBe(2);
      expect(summary.errors).toHaveLength(2);
    });

    test('should count errors by type', () => {
      const records = [
        new LeadRecord({
          _id: '',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test2',
          email: '',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'test3',
          email: 'test3@example.com',
          entryDate: 'invalid-date'
        })
      ];

      const summary = validator.validateRecords(records);

      expect(summary.errorCounts['empty_value']).toBe(2);
      expect(summary.errorCounts['invalid_date']).toBe(1);
    });
  });

  describe('getErrorReport', () => {
    test('should return success message for valid records', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const summary = validator.validateRecords(records);
      const report = validator.getErrorReport(summary);

      expect(report).toBe('All records are valid.');
    });

    test('should generate detailed error report', () => {
      const records = [
        new LeadRecord({
          _id: '',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test2',
          email: '',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'test3',
          email: 'test3@example.com',
          entryDate: 'invalid-date'
        })
      ];

      const summary = validator.validateRecords(records);
      const report = validator.getErrorReport(summary);

      expect(report).toContain('Validation failed: 3 of 3 records have errors');
      expect(report).toContain('Empty Values (2 occurrences)');
      expect(report).toContain('Invalid Date Formats (1 occurrences)');
      expect(report).toContain('Empty value for required field: _id');
      expect(report).toContain('Empty value for required field: email');
      expect(report).toContain('Invalid date format for field entryDate');
    });
  });

  describe('getExampleErrors', () => {
    test('should return one example per error type', () => {
      const records = [
        new LeadRecord({
          _id: '',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test2',
          email: '',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'test3',
          email: 'test3@example.com',
          entryDate: 'invalid-date'
        })
      ];

      const summary = validator.validateRecords(records);
      const examples = validator.getExampleErrors(summary);

      expect(examples).toHaveLength(2); // empty_value and invalid_date
      expect(examples.some(e => e.type === 'empty_value')).toBe(true);
      expect(examples.some(e => e.type === 'invalid_date')).toBe(true);
    });
  });

  describe('custom configuration', () => {
    test('should allow empty values when configured', () => {
      const customValidator = RecordValidator.createValidator({
        allowEmptyValues: true
      });

      const record = new LeadRecord({
        _id: '',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const errors = customValidator.validateRecord(record);

      expect(errors).toHaveLength(0);
    });

    test('should validate custom required fields', () => {
      const customValidator = RecordValidator.createValidator({
        requiredFields: ['_id', 'email', 'firstName']
      });

      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
        // missing firstName
      });

      const errors = customValidator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.field).toBe('firstName');
    });

    test('should validate custom date fields', () => {
      const customValidator = RecordValidator.createValidator({
        dateFields: ['entryDate', 'createdAt']
      });

      // Create a record with a custom field
      const recordData = {
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00',
        createdAt: 'invalid-date'
      };

      // Create a record-like object for testing
      const record = {
        _id: recordData._id,
        email: recordData.email,
        entryDate: recordData.entryDate,
        createdAt: recordData.createdAt,
        validate: () => ({ isValid: true, errors: [] })
      } as any;

      const errors = customValidator.validateRecord(record);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.field).toBe('createdAt');
    });
  });

  describe('static factory methods', () => {
    test('should create default validator', () => {
      const defaultValidator = RecordValidator.createDefaultValidator();
      
      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const errors = defaultValidator.validateRecord(record);
      expect(errors).toHaveLength(0);
    });

    test('should create validator with custom config', () => {
      const customValidator = RecordValidator.createValidator({
        requiredFields: ['_id'],
        dateFields: []
      });

      const record = new LeadRecord({
        _id: 'test123',
        email: 'test@example.com',
        entryDate: 'invalid-date'
      });

      const errors = customValidator.validateRecord(record);
      expect(errors).toHaveLength(0); // Only _id is required, date validation is disabled
    });
  });
});
