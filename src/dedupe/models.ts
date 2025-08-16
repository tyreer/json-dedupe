import { parseISO, isValid } from 'date-fns';

/**
 * Interface for lead record data
 */
export interface LeadRecordData {
  _id: string;
  email: string;
  entryDate: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  address?: string | undefined;
}

/**
 * Interface for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Represents a lead record with validation and date parsing capabilities
 */
export class LeadRecord {
  public readonly _id: string;
  public readonly email: string;
  public readonly entryDate: string;
  public readonly firstName?: string | undefined;
  public readonly lastName?: string | undefined;
  public readonly address?: string | undefined;
  private readonly _parsedDate: Date | null;

  /**
   * Create a new LeadRecord instance
   * @param data - The record data
   */
  constructor(data: LeadRecordData) {
    this._id = data._id;
    this.email = data.email;
    this.entryDate = data.entryDate;
    this.firstName = data.firstName ?? undefined;
    this.lastName = data.lastName ?? undefined;
    this.address = data.address ?? undefined;
    
    // Parse and validate the entry date
    this._parsedDate = this._parseDate(this.entryDate);
  }

  /**
   * Parse a date string into a Date object
   * @param dateString - The date string to parse
   * @returns The parsed date or null if invalid
   * @private
   */
  private _parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the parsed date object
   * @returns The parsed date or null if invalid
   */
  public getParsedDate(): Date | null {
    return this._parsedDate;
  }

  /**
   * Check if the record has a valid date
   * @returns True if the date is valid
   */
  public hasValidDate(): boolean {
    return this._parsedDate !== null;
  }

  /**
   * Validate required fields
   * @returns Validation result with isValid boolean and errors array
   */
  public validate(): ValidationResult {
    const errors: string[] = [];

    if (!this._id || this._id.trim() === '') {
      errors.push('Missing or empty _id field');
    }

    if (!this.email || this.email.trim() === '') {
      errors.push('Missing or empty email field');
    }

    if (!this.entryDate || this.entryDate.trim() === '') {
      errors.push('Missing or empty entryDate field');
    } else if (!this.hasValidDate()) {
      errors.push(`Invalid date format: ${this.entryDate}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get a string representation of the record
   * @returns String representation
   */
  public toString(): string {
    return `LeadRecord(_id: ${this._id}, email: ${this.email}, entryDate: ${this.entryDate})`;
  }

  /**
   * Convert the record to a plain object
   * @returns Plain object representation
   */
  public toObject(): LeadRecordData {
    return {
      _id: this._id,
      email: this.email,
      entryDate: this.entryDate,
      firstName: this.firstName ?? undefined,
      lastName: this.lastName ?? undefined,
      address: this.address ?? undefined
    };
  }

  /**
   * Compare this record with another by date
   * @param other - The other record to compare with
   * @returns -1 if this is older, 1 if this is newer, 0 if same
   */
  public compareByDate(other: LeadRecord): number {
    if (!this.hasValidDate() || !other.hasValidDate()) {
      return 0; // Can't compare invalid dates
    }

    const thisTime = this._parsedDate!.getTime();
    const otherTime = other._parsedDate!.getTime();

    if (thisTime < otherTime) return -1;
    if (thisTime > otherTime) return 1;
    return 0;
  }
}
