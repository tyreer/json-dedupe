import { parseISO, isValid, parse, format } from 'date-fns';

/**
 * Interface for date parsing options
 */
export interface DateParseOptions {
  fallbackFormats?: string[];
  timezone?: string;
}

/**
 * Interface for date parsing result
 */
export interface DateParseResult {
  date: Date | null;
  isValid: boolean;
  format: string | null;
  error?: string;
}

/**
 * Utility class for flexible date parsing
 */
export class DateUtils {
  /**
   * Common date formats to try when parsing
   */
  private static readonly COMMON_FORMATS = [
    // ISO 8601 formats
    "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
    "yyyy-MM-dd'T'HH:mm:ssxxx",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd'T'HH:mmxxx",
    "yyyy-MM-dd'T'HH:mm",
    
    // RFC 3339 formats
    "yyyy-MM-dd'T'HH:mm:ss'Z'",
    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
    
    // Common date formats
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "dd/MM/yyyy",
    "yyyy/MM/dd",
    "MM-dd-yyyy",
    "dd-MM-yyyy",
    
    // Unix timestamp (seconds)
    "t",
    
    // Unix timestamp (milliseconds)
    "T"
  ];

  /**
   * Parse a date string with multiple format support
   * @param dateString - The date string to parse
   * @param options - Parsing options
   * @returns DateParseResult with parsed date and metadata
   */
  public static parseDate(dateString: string, options: DateParseOptions = {}): DateParseResult {
    if (!dateString || dateString.trim() === '') {
      return {
        date: null,
        isValid: false,
        format: null,
        error: 'Empty date string'
      };
    }

    const trimmedDate = dateString.trim();

    // Try ISO 8601 parsing first (most common for our use case)
    try {
      const isoDate = parseISO(trimmedDate);
      if (isValid(isoDate)) {
        return {
          date: isoDate,
          isValid: true,
          format: 'ISO 8601'
        };
      }
    } catch (error) {
      // Continue to other formats
    }

    // Try Unix timestamp formats
    if (/^\d{10}$/.test(trimmedDate)) {
      // Unix timestamp in seconds
      const timestamp = parseInt(trimmedDate, 10) * 1000;
      const date = new Date(timestamp);
      if (isValid(date)) {
        return {
          date,
          isValid: true,
          format: 'Unix timestamp (seconds)'
        };
      }
    }

    if (/^\d{13}$/.test(trimmedDate)) {
      // Unix timestamp in milliseconds
      const timestamp = parseInt(trimmedDate, 10);
      const date = new Date(timestamp);
      if (isValid(date)) {
        return {
          date,
          isValid: true,
          format: 'Unix timestamp (milliseconds)'
        };
      }
    }

    // Try common date formats
    for (const formatStr of this.COMMON_FORMATS) {
      try {
        const parsedDate = parse(trimmedDate, formatStr, new Date());
        if (isValid(parsedDate)) {
          return {
            date: parsedDate,
            isValid: true,
            format: formatStr
          };
        }
      } catch (error) {
        // Continue to next format
      }
    }

    // Try fallback formats if provided
    if (options.fallbackFormats) {
      for (const formatStr of options.fallbackFormats) {
        try {
          const parsedDate = parse(trimmedDate, formatStr, new Date());
          if (isValid(parsedDate)) {
            return {
              date: parsedDate,
              isValid: true,
              format: `Custom: ${formatStr}`
            };
          }
        } catch (error) {
          // Continue to next format
        }
      }
    }

    return {
      date: null,
      isValid: false,
      format: null,
      error: `Unable to parse date: ${trimmedDate}`
    };
  }

  /**
   * Validate if a date string can be parsed
   * @param dateString - The date string to validate
   * @param options - Parsing options
   * @returns True if the date can be parsed
   */
  public static isValidDate(dateString: string, options: DateParseOptions = {}): boolean {
    const result = this.parseDate(dateString, options);
    return result.isValid;
  }

  /**
   * Format a date to ISO 8601 string
   * @param date - The date to format
   * @returns ISO 8601 formatted string
   */
  public static formatToISO(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  }

  /**
   * Get a human-readable description of the date format
   * @param dateString - The date string to analyze
   * @returns Description of the detected format
   */
  public static getFormatDescription(dateString: string): string {
    const result = this.parseDate(dateString);
    if (result.isValid && result.format) {
      return result.format;
    }
    return 'Unknown format';
  }

  /**
   * Compare two date strings
   * @param date1 - First date string
   * @param date2 - Second date string
   * @param options - Parsing options
   * @returns -1 if date1 < date2, 1 if date1 > date2, 0 if equal, null if invalid
   */
  public static compareDates(
    date1: string, 
    date2: string, 
    options: DateParseOptions = {}
  ): number | null {
    const result1 = this.parseDate(date1, options);
    const result2 = this.parseDate(date2, options);

    if (!result1.isValid || !result2.isValid) {
      return null;
    }

    const time1 = result1.date!.getTime();
    const time2 = result2.date!.getTime();

    if (time1 < time2) return -1;
    if (time1 > time2) return 1;
    return 0;
  }
}
