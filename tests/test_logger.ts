import { ChangeLogger } from '../src/dedupe/logger';
import { MergeDecision } from '../src/dedupe/engine';
import { LeadRecord } from '../src/dedupe/models';

describe('ChangeLogger', () => {
  let logger: ChangeLogger;

  beforeEach(() => {
    logger = new ChangeLogger();
  });

  describe('basic functionality', () => {
    test('should create empty logger', () => {
      expect(logger.getEntryCount()).toBe(0);
      expect(logger.hasChanges()).toBe(false);
      expect(logger.getEntries()).toHaveLength(0);
    });

    test('should clear all entries', () => {
      const decision = createTestDecision();
      logger.logMergeDecision(decision);
      expect(logger.getEntryCount()).toBe(1);

      logger.clear();
      expect(logger.getEntryCount()).toBe(0);
      expect(logger.hasChanges()).toBe(false);
    });
  });

  describe('logging merge decisions', () => {
    test('should log single merge decision', () => {
      const decision = createTestDecision();
      logger.logMergeDecision(decision);

      expect(logger.getEntryCount()).toBe(1);
      expect(logger.hasChanges()).toBe(true);

      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);

      const entry = entries[0]!;
      expect(entry.keptRecordId).toBe('kept-id');
      expect(entry.droppedRecordId).toBe('dropped-id');
      expect(entry.conflictType).toBe('id_conflict');
      expect(entry.reason).toBe('newer_date');
      expect(entry.timestamp).toBeDefined();
    });

    test('should log multiple merge decisions', () => {
      const decision1 = createTestDecision('id1', 'id2', 'id_conflict');
      const decision2 = createTestDecision('id3', 'id4', 'email_conflict');

      logger.logMergeDecisions([decision1, decision2]);

      expect(logger.getEntryCount()).toBe(2);
      expect(logger.hasChanges()).toBe(true);

      const entries = logger.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0]!.conflictType).toBe('id_conflict');
      expect(entries[1]!.conflictType).toBe('email_conflict');
    });

    test('should track field changes correctly', () => {
      const keptRecord = new LeadRecord({
        _id: 'same-id',
        email: 'kept@example.com',
        entryDate: '2014-05-07T17:31:20+00:00',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St'
      });

      const droppedRecord = new LeadRecord({
        _id: 'same-id',
        email: 'dropped@example.com',
        entryDate: '2014-05-07T17:30:20+00:00',
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave'
      });

      const decision: MergeDecision = {
        keptRecord,
        droppedRecord,
        reason: 'newer_date',
        conflictType: 'id_conflict'
      };

      logger.logMergeDecision(decision);

      const entries = logger.getEntries();
      const entry = entries[0]!;
      const changes = entry.changes;

      // Check that different fields are logged
      expect(changes['keptEmail']).toBe('kept@example.com');
      expect(changes['droppedEmail']).toBe('dropped@example.com');
      expect(changes['keptFirstName']).toBe('John');
      expect(changes['droppedFirstName']).toBe('Jane');
      expect(changes['keptLastName']).toBe('Doe');
      expect(changes['droppedLastName']).toBe('Smith');
      expect(changes['keptAddress']).toBe('123 Main St');
      expect(changes['droppedAddress']).toBe('456 Oak Ave');

      // Check that identical fields are not logged
      expect(changes['keptId']).toBeUndefined();
      expect(changes['droppedId']).toBeUndefined();
    });

    test('should handle _id field capitalization correctly', () => {
      const keptRecord = new LeadRecord({
        _id: 'same-id',
        email: 'kept@example.com',
        entryDate: '2014-05-07T17:31:20+00:00'
      });

      const droppedRecord = new LeadRecord({
        _id: 'different-id',
        email: 'kept@example.com',
        entryDate: '2014-05-07T17:31:20+00:00'
      });

      const decision: MergeDecision = {
        keptRecord,
        droppedRecord,
        reason: 'newer_date',
        conflictType: 'id_conflict'
      };

      logger.logMergeDecision(decision);

      const entries = logger.getEntries();
      const entry = entries[0]!;
      const changes = entry.changes;

      // _id should be capitalized as Id
      expect(changes['keptId']).toBe('same-id');
      expect(changes['droppedId']).toBe('different-id');
    });
  });

  describe('summary statistics', () => {
    test('should track conflict type statistics', () => {
      const idDecision = createTestDecision('id1', 'id2', 'id_conflict');
      const emailDecision = createTestDecision('id3', 'id4', 'email_conflict');
      const anotherIdDecision = createTestDecision('id5', 'id6', 'id_conflict');

      logger.logMergeDecisions([idDecision, emailDecision, anotherIdDecision]);

      const summary = logger.getSummary();
      expect(summary.totalConflicts).toBe(3);
      expect(summary.idConflicts).toBe(2);
      expect(summary.emailConflicts).toBe(1);
      expect(summary.totalChanges).toBeGreaterThan(0);
    });

    test('should track cross-conflicts', () => {
      logger.logCrossConflicts([{ type: 'cross_conflict' }, { type: 'cross_conflict' }]);

      const summary = logger.getSummary();
      expect(summary.crossConflicts).toBe(2);
    });

    test('should update timestamp on creation', () => {
      const summary = logger.getSummary();
      expect(summary.timestamp).toBeDefined();
      expect(new Date(summary.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('filtering and querying', () => {
    beforeEach(() => {
      const idDecision = createTestDecision('id1', 'id2', 'id_conflict');
      const emailDecision = createTestDecision('id3', 'id4', 'email_conflict');
      const newerDateDecision = createTestDecision('id5', 'id6', 'id_conflict', 'newer_date');
      const lastInListDecision = createTestDecision('id7', 'id8', 'email_conflict', 'last_in_list');

      logger.logMergeDecisions([idDecision, emailDecision, newerDateDecision, lastInListDecision]);
    });

    test('should filter entries by conflict type', () => {
      const idEntries = logger.getEntriesByConflictType('id_conflict');
      const emailEntries = logger.getEntriesByConflictType('email_conflict');

      expect(idEntries).toHaveLength(2);
      expect(emailEntries).toHaveLength(2);

      idEntries.forEach(entry => {
        expect(entry.conflictType).toBe('id_conflict');
      });

      emailEntries.forEach(entry => {
        expect(entry.conflictType).toBe('email_conflict');
      });
    });

    test('should filter entries by reason', () => {
      const newerDateEntries = logger.getEntriesByReason('newer_date');
      const lastInListEntries = logger.getEntriesByReason('last_in_list');

      expect(newerDateEntries).toHaveLength(3);
      expect(lastInListEntries).toHaveLength(1);

      newerDateEntries.forEach(entry => {
        expect(entry.reason).toBe('newer_date');
      });

      lastInListEntries.forEach(entry => {
        expect(entry.reason).toBe('last_in_list');
      });
    });

    test('should filter entries by record ID', () => {
      const id1Entries = logger.getEntriesByRecordId('id1');
      const id3Entries = logger.getEntriesByRecordId('id3');

      expect(id1Entries).toHaveLength(1);
      expect(id3Entries).toHaveLength(1);

      expect(id1Entries[0]!.keptRecordId).toBe('id1');
      expect(id3Entries[0]!.keptRecordId).toBe('id3');
    });
  });

  describe('JSON output', () => {
    test('should generate valid JSON', () => {
      const decision = createTestDecision();
      logger.logMergeDecision(decision);

      const json = logger.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('entries');
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.summary.totalConflicts).toBe(1);
    });

    test('should generate pretty JSON', () => {
      const decision = createTestDecision();
      logger.logMergeDecision(decision);

      const prettyJson = logger.toJSON(true);
      const compactJson = logger.toJSON(false);

      expect(prettyJson).toContain('\n');
      expect(compactJson).not.toContain('\n');
      expect(prettyJson.length).toBeGreaterThan(compactJson.length);
    });

    test('should generate complete log structure', () => {
      const decision = createTestDecision();
      logger.logMergeDecision(decision);

      const log = logger.getChangeLog();

      expect(log).toHaveProperty('summary');
      expect(log).toHaveProperty('entries');
      expect(log.entries).toHaveLength(1);

      const entry = log.entries[0]!;
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('keptRecordId');
      expect(entry).toHaveProperty('droppedRecordId');
      expect(entry).toHaveProperty('conflictType');
      expect(entry).toHaveProperty('reason');
      expect(entry).toHaveProperty('changes');
      expect(entry).toHaveProperty('metadata');
    });
  });

  describe('metadata tracking', () => {
    test('should include complete metadata', () => {
      const keptRecord = new LeadRecord({
        _id: 'kept-id',
        email: 'kept@example.com',
        entryDate: '2014-05-07T17:31:20+00:00'
      });

      const droppedRecord = new LeadRecord({
        _id: 'dropped-id',
        email: 'dropped@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const decision: MergeDecision = {
        keptRecord,
        droppedRecord,
        reason: 'newer_date',
        conflictType: 'id_conflict'
      };

      logger.logMergeDecision(decision);

      const entries = logger.getEntries();
      const entry = entries[0]!;
      const metadata = entry.metadata;

      expect(metadata.keptRecordEmail).toBe('kept@example.com');
      expect(metadata.droppedRecordEmail).toBe('dropped@example.com');
      expect(metadata.keptRecordDate).toBe('2014-05-07T17:31:20+00:00');
      expect(metadata.droppedRecordDate).toBe('2014-05-07T17:30:20+00:00');
    });
  });

  describe('edge cases', () => {
    test('should handle records with no field differences', () => {
      const keptRecord = new LeadRecord({
        _id: 'same-id',
        email: 'same@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const droppedRecord = new LeadRecord({
        _id: 'same-id',
        email: 'same@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const decision: MergeDecision = {
        keptRecord,
        droppedRecord,
        reason: 'last_in_list',
        conflictType: 'id_conflict'
      };

      logger.logMergeDecision(decision);

      const entries = logger.getEntries();
      const entry = entries[0]!;
      const changes = entry.changes;

      // Should still log the entry but with no field changes
      expect(entries).toHaveLength(1);
      expect(Object.keys(changes)).toHaveLength(0);
    });

    test('should handle undefined and null values', () => {
      const keptRecord = new LeadRecord({
        _id: 'same-id',
        email: 'kept@example.com',
        entryDate: '2014-05-07T17:31:20+00:00',
        firstName: 'John',
        lastName: undefined,
        address: undefined
      });

      const droppedRecord = new LeadRecord({
        _id: 'same-id',
        email: 'dropped@example.com',
        entryDate: '2014-05-07T17:30:20+00:00',
        firstName: undefined,
        lastName: 'Smith',
        address: null as any
      });

      const decision: MergeDecision = {
        keptRecord,
        droppedRecord,
        reason: 'newer_date',
        conflictType: 'id_conflict'
      };

      logger.logMergeDecision(decision);

      const entries = logger.getEntries();
      const entry = entries[0]!;
      const changes = entry.changes;

      expect(changes['keptFirstName']).toBe('John');
      expect(changes['droppedFirstName']).toBeUndefined();
      expect(changes['keptLastName']).toBeUndefined();
      expect(changes['droppedLastName']).toBe('Smith');
    });
  });
});

/**
 * Helper function to create test merge decisions
 */
function createTestDecision(
  keptId: string = 'kept-id',
  droppedId: string = 'dropped-id',
  conflictType: 'id_conflict' | 'email_conflict' = 'id_conflict',
  reason: 'newer_date' | 'last_in_list' | 'same_record' = 'newer_date'
): MergeDecision {
  const keptRecord = new LeadRecord({
    _id: keptId,
    email: 'kept@example.com',
    entryDate: '2014-05-07T17:31:20+00:00'
  });

  const droppedRecord = new LeadRecord({
    _id: droppedId,
    email: 'dropped@example.com',
    entryDate: '2014-05-07T17:30:20+00:00'
  });

  return {
    keptRecord,
    droppedRecord,
    reason,
    conflictType
  };
}
