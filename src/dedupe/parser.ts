import * as fs from 'fs';
import { LeadRecord, LeadRecordData } from './models';

/**
 * Interface for JSON data structure
 */
export interface JsonData {
  [key: string]: any;
}

/**
 * JSON parser for lead records with error handling
 */
export class JsonParser {
  /**
   * Parse a JSON file and convert to LeadRecord objects
   * @param filePath - Path to the JSON file
   * @param keyNames - Array of key names to process (default: ['leads'])
   * @returns Array of LeadRecord objects
   * @throws Error if file cannot be read or JSON is malformed
   */
  public static parseFile(filePath: string, keyNames: string[] = ['leads']): LeadRecord[] {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return this.parseContent(fileContent, keyNames);
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error) {
          const nodeError = error as NodeJS.ErrnoException;
          if (nodeError.code === 'ENOENT') {
            throw new Error(`File not found: ${filePath}`);
          } else if (nodeError.code === 'EACCES') {
            throw new Error(`Permission denied: ${filePath}`);
          }
        }
        throw new Error(`Error reading file ${filePath}: ${error.message}`);
      }
      throw new Error(`Unknown error reading file ${filePath}`);
    }
  }

  /**
   * Parse JSON content from stdin or string
   * @param content - JSON content as string
   * @param keyNames - Array of key names to process (default: ['leads'])
   * @returns Array of LeadRecord objects
   * @throws Error if JSON is malformed or structure is invalid
   */
  public static parseContent(content: string, keyNames: string[] = ['leads']): LeadRecord[] {
    if (!content || content.trim() === '') {
      throw new Error('Empty or invalid JSON content');
    }

    let jsonData: JsonData;
    try {
      jsonData = JSON.parse(content) as JsonData;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
      throw new Error('Invalid JSON format');
    }

    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('JSON content must be an object');
    }

    // Validate that all specified keys exist and are arrays
    for (const keyName of keyNames) {
      if (!jsonData[keyName]) {
        throw new Error(`JSON must contain a "${keyName}" array`);
      }
      if (!Array.isArray(jsonData[keyName])) {
        throw new Error(`"${keyName}" field must be an array`);
      }
    }

    const records: LeadRecord[] = [];
    const errors: string[] = [];

    // Process all specified keys
    for (const keyName of keyNames) {
      const keyRecords = jsonData[keyName] as LeadRecordData[];
      
      keyRecords.forEach((recordData: LeadRecordData, index: number) => {
        try {
          if (!recordData || typeof recordData !== 'object') {
            errors.push(`Record at index ${index} in "${keyName}": must be an object`);
            return;
          }

          const record = new LeadRecord(recordData);
          records.push(record);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Record at index ${index} in "${keyName}": ${errorMessage}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`Failed to parse some records:\n${errors.join('\n')}`);
    }

    return records;
  }

  /**
   * Parse JSON from stdin
   * @param keyNames - Array of key names to process (default: ['leads'])
   * @returns Array of LeadRecord objects
   * @throws Error if stdin is empty or JSON is malformed
   */
  public static parseStdin(keyNames: string[] = ['leads']): LeadRecord[] {
    const content = fs.readFileSync(0, 'utf8'); // Read from stdin
    return this.parseContent(content, keyNames);
  }

  /**
   * Validate that a file exists and is readable
   * @param filePath - Path to the file
   * @returns True if file exists and is readable
   */
  public static validateFile(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param filePath - Path to the file
   * @returns File size in bytes
   * @throws Error if file cannot be accessed
   */
  public static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Cannot access file ${filePath}: ${error.message}`);
      }
      throw new Error(`Cannot access file ${filePath}`);
    }
  }
}
