import { MergeDecision } from './engine';

/**
 * Interface for field change information
 */
export interface FieldChange {
  field: string;
  keptValue: any;
  droppedValue: any;
  conflictType: 'id_conflict' | 'email_conflict' | 'cross_conflict';
  reason: 'newer_date' | 'last_in_list' | 'same_record';
}

/**
 * Interface for log entry
 */
export interface LogEntry {
  timestamp: string;
  keptRecordId: string;
  droppedRecordId: string;
  conflictType: 'id_conflict' | 'email_conflict' | 'cross_conflict';
  reason: 'newer_date' | 'last_in_list' | 'same_record';
  changes: Record<string, any>; // kept<Field> and dropped<Field> format
  metadata: {
    keptRecordEmail: string;
    droppedRecordEmail: string;
    keptRecordDate: string;
    droppedRecordDate: string;
  };
}

/**
 * Interface for complete log structure
 */
export interface ChangeLog {
  summary: {
    totalConflicts: number;
    idConflicts: number;
    emailConflicts: number;
    crossConflicts: number;
    totalChanges: number;
    timestamp: string;
  };
  entries: LogEntry[];
}

/**
 * Change logging system for deduplication operations
 */
export class ChangeLogger {
  private entries: LogEntry[] = [];
  private summary = {
    totalConflicts: 0,
    idConflicts: 0,
    emailConflicts: 0,
    crossConflicts: 0,
    totalChanges: 0,
    timestamp: new Date().toISOString()
  };

  /**
   * Clear all logged entries
   */
  public clear(): void {
    this.entries = [];
    this.summary = {
      totalConflicts: 0,
      idConflicts: 0,
      emailConflicts: 0,
      crossConflicts: 0,
      totalChanges: 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log a merge decision with field changes
   * @param decision - The merge decision to log
   */
  public logMergeDecision(decision: MergeDecision): void {
    const fieldChanges = this.extractFieldChanges(decision);
    const changes: Record<string, any> = {};

    // Build changes object in kept<Field> and dropped<Field> format
    fieldChanges.forEach(change => {
      changes[`kept${this.capitalizeField(change.field)}`] = change.keptValue;
      changes[`dropped${this.capitalizeField(change.field)}`] = change.droppedValue;
    });

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      keptRecordId: decision.keptRecord._id,
      droppedRecordId: decision.droppedRecord._id,
      conflictType: decision.conflictType,
      reason: decision.reason,
      changes,
      metadata: {
        keptRecordEmail: decision.keptRecord.email,
        droppedRecordEmail: decision.droppedRecord.email,
        keptRecordDate: decision.keptRecord.entryDate,
        droppedRecordDate: decision.droppedRecord.entryDate
      }
    };

    this.entries.push(entry);
    this.updateSummary(decision.conflictType, fieldChanges.length);
  }

  /**
   * Log multiple merge decisions
   * @param decisions - Array of merge decisions to log
   */
  public logMergeDecisions(decisions: MergeDecision[]): void {
    decisions.forEach(decision => this.logMergeDecision(decision));
  }

  /**
   * Extract field changes between two records
   * @param decision - The merge decision containing the records
   * @returns Array of field changes
   * @private
   */
  private extractFieldChanges(decision: MergeDecision): FieldChange[] {
    const changes: FieldChange[] = [];
    const keptRecord = decision.keptRecord;
    const droppedRecord = decision.droppedRecord;

    // Get all possible fields from both records
    const allFields = new Set([
      '_id', 'email', 'entryDate', 'firstName', 'lastName', 'address'
    ]);

    allFields.forEach(field => {
      const keptValue = (keptRecord as any)[field];
      const droppedValue = (droppedRecord as any)[field];

      // Only log changes if values are different
      if (keptValue !== droppedValue) {
        changes.push({
          field,
          keptValue,
          droppedValue,
          conflictType: decision.conflictType,
          reason: decision.reason
        });
      }
    });

    return changes;
  }

  /**
   * Capitalize field name for kept/dropped format
   * @param field - The field name to capitalize
   * @returns Capitalized field name
   * @private
   */
  private capitalizeField(field: string): string {
    if (field === '_id') return 'Id';
    return field.charAt(0).toUpperCase() + field.slice(1);
  }

  /**
   * Update summary statistics
   * @param conflictType - Type of conflict
   * @param changeCount - Number of field changes
   * @private
   */
  private updateSummary(conflictType: 'id_conflict' | 'email_conflict' | 'cross_conflict', changeCount: number): void {
    this.summary.totalConflicts++;
    this.summary.totalChanges += changeCount;

    if (conflictType === 'id_conflict') {
      this.summary.idConflicts++;
    } else if (conflictType === 'email_conflict') {
      this.summary.emailConflicts++;
    } else if (conflictType === 'cross_conflict') {
      this.summary.crossConflicts++;
    }
  }

  /**
   * Log cross-conflicts
   * @param crossConflicts - Array of cross-conflict information
   */
  public logCrossConflicts(crossConflicts: any[]): void {
    this.summary.crossConflicts = crossConflicts.length;
  }

  /**
   * Get the complete change log
   * @returns Complete log structure
   */
  public getChangeLog(): ChangeLog {
    return {
      summary: { ...this.summary },
      entries: [...this.entries]
    };
  }

  /**
   * Get log entries
   * @returns Array of log entries
   */
  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get summary statistics
   * @returns Summary statistics
   */
  public getSummary(): ChangeLog['summary'] {
    return { ...this.summary };
  }

  /**
   * Get log as JSON string
   * @param pretty - Whether to format the JSON with indentation
   * @returns JSON string representation of the log
   */
  public toJSON(pretty: boolean = false): string {
    const log = this.getChangeLog();
    return pretty ? JSON.stringify(log, null, 2) : JSON.stringify(log);
  }

  /**
   * Get number of entries logged
   * @returns Number of entries
   */
  public getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Check if any changes have been logged
   * @returns True if changes have been logged
   */
  public hasChanges(): boolean {
    return this.entries.length > 0;
  }

  /**
   * Get entries for a specific conflict type
   * @param conflictType - The conflict type to filter by
   * @returns Filtered entries
   */
  public getEntriesByConflictType(conflictType: 'id_conflict' | 'email_conflict' | 'cross_conflict'): LogEntry[] {
    return this.entries.filter(entry => entry.conflictType === conflictType);
  }

  /**
   * Get entries for a specific reason
   * @param reason - The reason to filter by
   * @returns Filtered entries
   */
  public getEntriesByReason(reason: 'newer_date' | 'last_in_list' | 'same_record'): LogEntry[] {
    return this.entries.filter(entry => entry.reason === reason);
  }

  /**
   * Get entries involving a specific record ID
   * @param recordId - The record ID to search for
   * @returns Filtered entries
   */
  public getEntriesByRecordId(recordId: string): LogEntry[] {
    return this.entries.filter(entry => 
      entry.keptRecordId === recordId || entry.droppedRecordId === recordId
    );
  }
}
