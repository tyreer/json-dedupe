import { LeadRecord } from './models';
import { DateUtils, DateParseOptions } from './utils';

/**
 * Interface for validation error details
 */
export interface ValidationError {
  type: 'missing_field' | 'invalid_date' | 'empty_value' | 'invalid_format';
  field: string;
  message: string;
  recordIndex?: number;
  recordId?: string;
}

/**
 * Interface for validation summary
 */
export interface ValidationSummary {
  isValid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ValidationError[];
  errorCounts: Record<string, number>;
}

/**
 * Interface for validation configuration
 */
export interface ValidationConfig {
  requiredFields: string[];
  dateFields: string[];
  dateParseOptions?: DateParseOptions;
  allowEmptyValues?: boolean;
}

/**
 * Comprehensive validation system for lead records
 */
export class RecordValidator {
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = {
      allowEmptyValues: false,
      ...config
    };
  }

  /**
   * Validate a single record
   * @param record - The record to validate
   * @param index - Index of the record in the dataset
   * @returns Validation result
   */
  public validateRecord(record: LeadRecord, index: number = 0): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required fields
    for (const field of this.config.requiredFields) {
      const value = (record as any)[field];
      
      if (value === undefined || value === null) {
        errors.push({
          type: 'missing_field',
          field,
          message: `Missing required field: ${field}`,
          recordIndex: index,
          recordId: record._id
        });
      } else if (!this.config.allowEmptyValues && typeof value === 'string' && value.trim() === '') {
        errors.push({
          type: 'empty_value',
          field,
          message: `Empty value for required field: ${field}`,
          recordIndex: index,
          recordId: record._id
        });
      }
    }

    // Validate date fields
    for (const field of this.config.dateFields) {
      const value = (record as any)[field];
      
      if (value !== undefined && value !== null && value !== '') {
        if (!DateUtils.isValidDate(value, this.config.dateParseOptions)) {
          errors.push({
            type: 'invalid_date',
            field,
            message: `Invalid date format for field ${field}: ${value}`,
            recordIndex: index,
            recordId: record._id
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate multiple records and collect all errors
   * @param records - Array of records to validate
   * @returns Validation summary with all errors
   */
  public validateRecords(records: LeadRecord[]): ValidationSummary {
    const allErrors: ValidationError[] = [];
    let validRecords = 0;
    let invalidRecords = 0;

    records.forEach((record, index) => {
      const recordErrors = this.validateRecord(record, index);
      
      if (recordErrors.length === 0) {
        validRecords++;
      } else {
        invalidRecords++;
        allErrors.push(...recordErrors);
      }
    });

    // Count errors by type
    const errorCounts: Record<string, number> = {};
    allErrors.forEach(error => {
      errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
    });

    return {
      isValid: allErrors.length === 0,
      totalRecords: records.length,
      validRecords,
      invalidRecords,
      errors: allErrors,
      errorCounts
    };
  }

  /**
   * Get a detailed error report for display
   * @param summary - Validation summary
   * @returns Formatted error report
   */
  public getErrorReport(summary: ValidationSummary): string {
    if (summary.isValid) {
      return 'All records are valid.';
    }

    const lines: string[] = [];
    lines.push(`Validation failed: ${summary.invalidRecords} of ${summary.totalRecords} records have errors.`);
    lines.push('');

    // Group errors by type
    const errorsByType = this.groupErrorsByType(summary.errors);
    
    for (const [type, errors] of Object.entries(errorsByType)) {
      lines.push(`${this.getErrorTypeDescription(type)} (${errors.length} occurrences):`);
      
      // Show first few examples
      const examples = errors.slice(0, 3);
      examples.forEach(error => {
        const location = error.recordIndex !== undefined ? `record ${error.recordIndex}` : '';
        const id = error.recordId ? ` (ID: ${error.recordId})` : '';
        lines.push(`  - ${error.message}${location}${id}`);
      });
      
      if (errors.length > 3) {
        lines.push(`  ... and ${errors.length - 3} more similar errors`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get a single example error for each type
   * @param summary - Validation summary
   * @returns Array of example errors
   */
  public getExampleErrors(summary: ValidationSummary): ValidationError[] {
    const examples: ValidationError[] = [];
    const seenTypes = new Set<string>();

    for (const error of summary.errors) {
      if (!seenTypes.has(error.type)) {
        examples.push(error);
        seenTypes.add(error.type);
      }
    }

    return examples;
  }

  /**
   * Check if validation should stop processing
   * @param summary - Validation summary
   * @returns True if processing should stop
   */
  public shouldStopProcessing(summary: ValidationSummary): boolean {
    return !summary.isValid;
  }

  /**
   * Group errors by type
   * @param errors - Array of validation errors
   * @returns Errors grouped by type
   */
  private groupErrorsByType(errors: ValidationError[]): Record<string, ValidationError[]> {
    const grouped: Record<string, ValidationError[]> = {};
    
    errors.forEach(error => {
      if (!grouped[error.type]) {
        grouped[error.type] = [];
      }
      if (!grouped[error.type]) {
        grouped[error.type] = [];
      }
      grouped[error.type]!.push(error);
    });

    return grouped;
  }

  /**
   * Get human-readable description of error type
   * @param type - Error type
   * @returns Description
   */
  private getErrorTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'missing_field': 'Missing Required Fields',
      'invalid_date': 'Invalid Date Formats',
      'empty_value': 'Empty Values',
      'invalid_format': 'Invalid Formats'
    };

    return descriptions[type] || type;
  }

  /**
   * Create a default validator for lead records
   * @returns Configured validator
   */
  public static createDefaultValidator(): RecordValidator {
    return new RecordValidator({
      requiredFields: ['_id', 'email', 'entryDate'],
      dateFields: ['entryDate'],
      allowEmptyValues: false
    });
  }

  /**
   * Create a validator with custom configuration
   * @param config - Custom validation configuration
   * @returns Configured validator
   */
  public static createValidator(config: Partial<ValidationConfig>): RecordValidator {
    const defaultConfig: ValidationConfig = {
      requiredFields: ['_id', 'email', 'entryDate'],
      dateFields: ['entryDate'],
      allowEmptyValues: false
    };

    return new RecordValidator({
      ...defaultConfig,
      ...config
    });
  }
}
