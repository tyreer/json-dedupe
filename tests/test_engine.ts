import { DeduplicationEngine } from '../src/dedupe/engine';
import { LeadRecord } from '../src/dedupe/models';

describe('DeduplicationEngine', () => {
  let engine: DeduplicationEngine;

  beforeEach(() => {
    engine = new DeduplicationEngine();
  });

  describe('basic functionality', () => {
    test('should add records and build indexes', () => {
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

      engine.addRecords(records);

      expect(engine.getAllRecords()).toHaveLength(2);
      expect(engine.getStatistics().totalRecords).toBe(2);
      expect(engine.getStatistics().uniqueIds).toBe(2);
      expect(engine.getStatistics().uniqueEmails).toBe(2);
    });

    test('should clear all records', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      engine.addRecords(records);
      expect(engine.getAllRecords()).toHaveLength(1);

      engine.clear();
      expect(engine.getAllRecords()).toHaveLength(0);
      expect(engine.getStatistics().totalRecords).toBe(0);
    });
  });

  describe('conflict detection', () => {
    test('should detect ID conflicts', () => {
      const records = [
        new LeadRecord({
          _id: 'same-id',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'test2@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      engine.addRecords(records);
      const conflicts = engine.detectConflicts();

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]!.type).toBe('id_conflict');
      expect(conflicts[0]!.records).toHaveLength(2);
      expect(conflicts[0]!.conflictingIds).toEqual(['same-id', 'same-id']);
    });

    test('should detect email conflicts', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'same@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test2',
          email: 'same@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      engine.addRecords(records);
      const conflicts = engine.detectConflicts();

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]!.type).toBe('email_conflict');
      expect(conflicts[0]!.records).toHaveLength(2);
    });

    test('should detect both ID and email conflicts', () => {
      const records = [
        new LeadRecord({
          _id: 'same-id',
          email: 'same@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'same@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      engine.addRecords(records);
      const conflicts = engine.detectConflicts();

      expect(conflicts).toHaveLength(2);
      expect(conflicts.some(c => c.type === 'id_conflict')).toBe(true);
      expect(conflicts.some(c => c.type === 'email_conflict')).toBe(true);
    });

    test('should not detect conflicts for unique records', () => {
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

      engine.addRecords(records);
      const conflicts = engine.detectConflicts();

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('cross-conflict detection', () => {
    test('should detect cross-conflicts when record has both ID and email conflicts', () => {
      const records = [
        new LeadRecord({
          _id: 'same-id',
          email: 'same@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'different@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'different-id',
          email: 'same@example.com',
          entryDate: '2014-05-07T17:32:20+00:00'
        })
      ];

      engine.addRecords(records);
      const crossConflicts = engine.detectCrossConflicts();

      expect(crossConflicts.length).toBeGreaterThan(0);
      expect(engine.hasCrossConflicts()).toBe(true);
    });

    test('should detect cross-conflicts for records with same ID but different emails', () => {
      const records = [
        new LeadRecord({
          _id: 'same-id',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'test2@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      engine.addRecords(records);
      const crossConflicts = engine.detectCrossConflicts();

      expect(crossConflicts).toHaveLength(1);
      expect(engine.hasCrossConflicts()).toBe(true);
      expect(crossConflicts[0]!.type).toBe('cross_conflict');
    });
  });

  describe('conflict resolution', () => {
    test('should resolve conflicts by keeping newer date', () => {
      const olderRecord = new LeadRecord({
        _id: 'same-id',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const newerRecord = new LeadRecord({
        _id: 'same-id',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:31:20+00:00'
      });

      engine.addRecords([olderRecord, newerRecord]);
      const conflicts = engine.detectConflicts();
      const decisions = engine.resolveConflicts(conflicts);

      expect(decisions).toHaveLength(1);
      expect(decisions[0]!.keptRecord).toBe(newerRecord);
      expect(decisions[0]!.droppedRecord).toBe(olderRecord);
      expect(decisions[0]!.reason).toBe('newer_date');
    });

    test('should resolve conflicts by keeping last in list when dates are identical', () => {
      const record1 = new LeadRecord({
        _id: 'same-id',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      const record2 = new LeadRecord({
        _id: 'same-id',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });

      engine.addRecords([record1, record2]);
      const conflicts = engine.detectConflicts();
      const decisions = engine.resolveConflicts(conflicts);

      expect(decisions).toHaveLength(1);
      expect(decisions[0]!.keptRecord).toBe(record2); // Last in list
      expect(decisions[0]!.droppedRecord).toBe(record1);
      expect(decisions[0]!.reason).toBe('last_in_list');
    });

    test('should handle multiple conflicts of same type', () => {
      const records = [
        new LeadRecord({
          _id: 'same-id',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'test2@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'test3@example.com',
          entryDate: '2014-05-07T17:32:20+00:00'
        })
      ];

      engine.addRecords(records);
      const conflicts = engine.detectConflicts();
      const decisions = engine.resolveConflicts(conflicts);

      expect(decisions).toHaveLength(2); // Two records dropped, one kept
      expect(decisions[0]!.keptRecord).toBe(records[2]); // Newest
      expect(decisions[1]!.keptRecord).toBe(records[2]); // Newest
    });
  });

  describe('complete deduplication', () => {
    test('should perform complete deduplication successfully', () => {
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
        }),
        new LeadRecord({
          _id: 'test1', // Duplicate ID
          email: 'test3@example.com',
          entryDate: '2014-05-07T17:32:20+00:00'
        })
      ];

      engine.addRecords(records);
      const result = engine.deduplicate();

      expect(result.uniqueRecords).toHaveLength(2);
      expect(result.conflicts).toHaveLength(1);
      expect(result.crossConflicts).toHaveLength(1); // Now detects cross-conflicts
      expect(result.summary.totalRecords).toBe(3);
      expect(result.summary.uniqueRecords).toBe(2);
      expect(result.summary.conflictsResolved).toBe(1);
    });

    test('should handle records with no conflicts', () => {
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

      engine.addRecords(records);
      const result = engine.deduplicate();

      expect(result.uniqueRecords).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.summary.conflictsResolved).toBe(0);
    });

    test('should maintain original order for unique records', () => {
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
        }),
        new LeadRecord({
          _id: 'test3',
          email: 'test3@example.com',
          entryDate: '2014-05-07T17:32:20+00:00'
        })
      ];

      engine.addRecords(records);
      const result = engine.deduplicate();

      expect(result.uniqueRecords).toEqual(records);
    });
  });

  describe('statistics', () => {
    test('should provide accurate statistics', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        }),
        new LeadRecord({
          _id: 'test1', // Duplicate ID
          email: 'test2@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        }),
        new LeadRecord({
          _id: 'test3',
          email: 'test1@example.com', // Duplicate email
          entryDate: '2014-05-07T17:32:20+00:00'
        })
      ];

      engine.addRecords(records);
      const stats = engine.getStatistics();

      expect(stats.totalRecords).toBe(3);
      expect(stats.uniqueIds).toBe(2); // test1, test3
      expect(stats.uniqueEmails).toBe(2); // test1@example.com, test2@example.com
      expect(stats.idConflicts).toBe(1);
      expect(stats.emailConflicts).toBe(1);
    });
  });

  describe('edge cases', () => {
    test('should handle records with invalid dates', () => {
      const records = [
        new LeadRecord({
          _id: 'same-id',
          email: 'test@example.com',
          entryDate: 'invalid-date'
        }),
        new LeadRecord({
          _id: 'same-id',
          email: 'test@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      engine.addRecords(records);
      const conflicts = engine.detectConflicts();
      const decisions = engine.resolveConflicts(conflicts);

      expect(decisions).toHaveLength(1);
      // Should prefer the record with valid date
      expect(decisions[0]!.keptRecord).toBe(records[1]);
    });

    test('should handle empty record set', () => {
      const result = engine.deduplicate();

      expect(result.uniqueRecords).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.summary.totalRecords).toBe(0);
    });
  });
});
