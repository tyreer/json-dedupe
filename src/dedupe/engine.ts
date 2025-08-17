import { LeadRecord } from './models';

/**
 * Interface for conflict information
 */
export interface ConflictInfo {
  type: 'id_conflict' | 'email_conflict' | 'cross_conflict';
  records: LeadRecord[];
  conflictingIds: string[];
  conflictingEmails?: string[];
  details?: {
    recordId: string;
    email: string;
    sameIdRecords: Array<{ id: string; email: string; entryDate: string }>;
    sameEmailRecords: Array<{ id: string; email: string; entryDate: string }>;
  };
}

/**
 * Interface for deduplication result
 */
export interface DeduplicationResult {
  uniqueRecords: LeadRecord[];
  conflicts: ConflictInfo[];
  crossConflicts: ConflictInfo[];
  summary: {
    totalRecords: number;
    uniqueRecords: number;
    conflictsResolved: number;
    crossConflictsFound: number;
  };
}

/**
 * Interface for merge decision
 */
export interface MergeDecision {
  keptRecord: LeadRecord;
  droppedRecord: LeadRecord;
  reason: 'newer_date' | 'last_in_list' | 'same_record';
  conflictType: 'id_conflict' | 'email_conflict' | 'cross_conflict';
}

/**
 * Core deduplication engine for lead records
 */
export class DeduplicationEngine {
  private records: LeadRecord[] = [];
  private idIndex: Map<string, LeadRecord[]> = new Map();
  private emailIndex: Map<string, LeadRecord[]> = new Map();

  /**
   * Add records to the deduplication engine
   * @param records - Array of records to process
   */
  public addRecords(records: LeadRecord[]): void {
    this.records = [...this.records, ...records];
    this.buildIndexes();
  }

  /**
   * Clear all records and indexes
   */
  public clear(): void {
    this.records = [];
    this.idIndex.clear();
    this.emailIndex.clear();
  }

  /**
   * Build indexes for efficient duplicate detection
   * @private
   */
  private buildIndexes(): void {
    this.idIndex.clear();
    this.emailIndex.clear();

    this.records.forEach(record => {
      // Index by ID
      if (!this.idIndex.has(record._id)) {
        this.idIndex.set(record._id, []);
      }
      this.idIndex.get(record._id)!.push(record);

      // Index by email
      if (!this.emailIndex.has(record.email)) {
        this.emailIndex.set(record.email, []);
      }
      this.emailIndex.get(record.email)!.push(record);
    });
  }

  /**
   * Detect all conflicts (ID and email based)
   * @returns Array of conflict information
   */
  public detectConflicts(): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    // Detect ID conflicts
    for (const [, records] of this.idIndex.entries()) {
      if (records.length > 1) {
        conflicts.push({
          type: 'id_conflict',
          records,
          conflictingIds: records.map(r => r._id)
        });
      }
    }

    // Detect email conflicts
    for (const [, records] of this.emailIndex.entries()) {
      if (records.length > 1) {
        conflicts.push({
          type: 'email_conflict',
          records,
          conflictingIds: records.map(r => r._id)
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect all conflicts including cross-conflicts (records with both ID and email conflicts)
   * @returns Array of all conflict information including cross-conflicts
   */
  public detectAllConflicts(): ConflictInfo[] {
    const idConflicts = this.detectConflicts();
    const allConflicts: ConflictInfo[] = [...idConflicts];

    // Group conflicts by record ID and email to identify cross-conflicts
    const recordConflicts = new Map<string, Set<string>>();
    const emailConflicts = new Map<string, Set<string>>();

    // Build conflict maps
    idConflicts.forEach(conflict => {
      conflict.records.forEach(record => {
        // Track ID conflicts
        if (!recordConflicts.has(record._id)) {
          recordConflicts.set(record._id, new Set());
        }
        recordConflicts.get(record._id)!.add(conflict.type);

        // Track email conflicts
        if (!emailConflicts.has(record.email)) {
          emailConflicts.set(record.email, new Set());
        }
        emailConflicts.get(record.email)!.add(conflict.type);
      });
    });

    // Find cross-conflicts: records that appear in both ID and email conflict groups
    const crossConflictGroups = new Map<string, LeadRecord[]>();

    for (const [recordId, conflictTypes] of recordConflicts.entries()) {
      if (conflictTypes.has('id_conflict')) {
        const record = this.records.find(r => r._id === recordId);
        if (record && emailConflicts.has(record.email)) {
          // This record has both ID and email conflicts
          const groupKey = `cross_${recordId}_${record.email}`;
          if (!crossConflictGroups.has(groupKey)) {
            crossConflictGroups.set(groupKey, []);
          }
          crossConflictGroups.get(groupKey)!.push(record);
        }
      }
    }

    // Convert to ConflictInfo format with detailed information
    for (const [, records] of crossConflictGroups.entries()) {
      if (records.length > 0) {
        const primaryRecord = records[0]!;
        
        // Find all records with the same ID
        const sameIdRecords = this.records.filter(r => r._id === primaryRecord._id);
        
        // Find all records with the same email
        const sameEmailRecords = this.records.filter(r => r.email === primaryRecord.email);
        
        // Combine all related records for this cross-conflict
        const allRelatedRecords = new Set([...sameIdRecords, ...sameEmailRecords]);
        
        allConflicts.push({
          type: 'cross_conflict',
          records: Array.from(allRelatedRecords),
          conflictingIds: [primaryRecord._id],
          conflictingEmails: [primaryRecord.email],
          details: {
            recordId: primaryRecord._id,
            email: primaryRecord.email,
            sameIdRecords: sameIdRecords.map(r => ({ id: r._id, email: r.email, entryDate: r.entryDate })),
            sameEmailRecords: sameEmailRecords.map(r => ({ id: r._id, email: r.email, entryDate: r.entryDate }))
          }
        });
      }
    }

    return allConflicts;
  }

  /**
   * Detect cross-conflicts (same record has both ID and email conflicts with different records)
   * @returns Array of cross-conflict information with detailed record information
   * @deprecated Use detectAllConflicts() instead
   */
  public detectCrossConflicts(): ConflictInfo[] {
    return this.detectAllConflicts().filter(conflict => conflict.type === 'cross_conflict');
  }

  /**
   * Resolve conflicts using date-based resolution
   * @param conflicts - Array of conflicts to resolve
   * @returns Array of merge decisions
   */
  public resolveConflicts(conflicts: ConflictInfo[]): MergeDecision[] {
    const decisions: MergeDecision[] = [];
    const processedGroups = new Set<string>();

    conflicts.forEach(conflict => {
      if (conflict.records.length > 1) {
        // Create a unique key for this group of records to avoid duplicate processing
        const recordIds = conflict.records.map(r => r._id).sort().join(',');
        const groupKey = recordIds; // Just use record IDs, ignore conflict type
        
        if (processedGroups.has(groupKey)) {
          return; // Skip if we've already processed this group
        }
        processedGroups.add(groupKey);

        const sortedRecords = this.sortRecordsByDate(conflict.records);
        const keptRecord = sortedRecords[0]; // First in sorted array is newest
        const droppedRecords = sortedRecords.slice(1); // All except the first

        droppedRecords.forEach(droppedRecord => {
          const reason = this.determineMergeReason(keptRecord!, droppedRecord);
          decisions.push({
            keptRecord: keptRecord!,
            droppedRecord,
            reason,
            conflictType: conflict.type
          });
        });
      }
    });

    return decisions;
  }

  /**
   * Sort records by date (newest first, with tie-breaking by list order)
   * @param records - Records to sort
   * @returns Sorted records (newest/last first)
   * @private
   */
  private sortRecordsByDate(records: LeadRecord[]): LeadRecord[] {
    return [...records].sort((a, b) => {
      // First, try to compare by date
      const dateComparison = a.compareByDate(b);
      if (dateComparison !== 0) {
        return -dateComparison; // Reverse for newest first
      }

      // If dates are identical, prefer the record that appears later in the original list
      const aIndex = this.records.indexOf(a);
      const bIndex = this.records.indexOf(b);
      return bIndex - aIndex; // Later index first
    });
  }

  /**
   * Determine the reason for keeping one record over another
   * @param keptRecord - The record being kept
   * @param droppedRecord - The record being dropped
   * @returns Reason for the merge decision
   * @private
   */
  private determineMergeReason(keptRecord: LeadRecord, droppedRecord: LeadRecord): 'newer_date' | 'last_in_list' | 'same_record' {
    const dateComparison = keptRecord.compareByDate(droppedRecord);
    
    if (dateComparison > 0) {
      return 'newer_date';
    } else if (dateComparison < 0) {
      return 'last_in_list'; // This shouldn't happen with our sorting, but handle it
    } else {
      return 'last_in_list'; // Same date, kept the one that appeared later in list
    }
  }

  /**
   * Perform complete deduplication
   * @returns Deduplication result with unique records and conflict information
   */
  public deduplicate(): DeduplicationResult {
    const allConflicts = this.detectAllConflicts();
    const decisions = this.resolveConflicts(allConflicts);

    // Build set of records to keep
    const recordsToKeep = new Set<LeadRecord>();
    const recordsToDrop = new Set<LeadRecord>();

    decisions.forEach(decision => {
      recordsToKeep.add(decision.keptRecord);
      recordsToDrop.add(decision.droppedRecord);
    });

    // Add records that had no conflicts
    this.records.forEach(record => {
      if (!recordsToDrop.has(record)) {
        recordsToKeep.add(record);
      }
    });

    // Convert to array and maintain original order
    const uniqueRecords = this.records.filter(record => recordsToKeep.has(record));

    // Separate conflicts by type for reporting
    const idConflicts = allConflicts.filter(c => c.type === 'id_conflict');
    const emailConflicts = allConflicts.filter(c => c.type === 'email_conflict');
    const crossConflicts = allConflicts.filter(c => c.type === 'cross_conflict');

    return {
      uniqueRecords,
      conflicts: [...idConflicts, ...emailConflicts],
      crossConflicts,
      summary: {
        totalRecords: this.records.length,
        uniqueRecords: uniqueRecords.length,
        conflictsResolved: decisions.length,
        crossConflictsFound: crossConflicts.length
      }
    };
  }

  /**
   * Get statistics about the current dataset
   * @returns Statistics object
   */
  public getStatistics(): {
    totalRecords: number;
    uniqueIds: number;
    uniqueEmails: number;
    idConflicts: number;
    emailConflicts: number;
  } {
    const conflicts = this.detectConflicts();
    const idConflicts = conflicts.filter(c => c.type === 'id_conflict').length;
    const emailConflicts = conflicts.filter(c => c.type === 'email_conflict').length;

    return {
      totalRecords: this.records.length,
      uniqueIds: this.idIndex.size,
      uniqueEmails: this.emailIndex.size,
      idConflicts,
      emailConflicts
    };
  }

  /**
   * Check if there are any cross-conflicts that would prevent safe deduplication
   * @returns True if cross-conflicts exist
   */
  public hasCrossConflicts(): boolean {
    return this.detectCrossConflicts().length > 0;
  }

  /**
   * Get all records currently in the engine
   * @returns Array of all records
   */
  public getAllRecords(): LeadRecord[] {
    return [...this.records];
  }
}
