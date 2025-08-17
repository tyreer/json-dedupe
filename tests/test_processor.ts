// Mock chalk before importing Processor
jest.mock('chalk', () => ({
  blue: jest.fn((text: string) => text),
  gray: jest.fn((text: string) => text),
  green: jest.fn((text: string) => text),
  red: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  cyan: jest.fn((text: string) => text),
}));

import { Processor, ProgressCallback } from '../src/processor';
import { CliConfig } from '../src/json-dedupe';
import { LeadRecord } from '../src/dedupe/models';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock the dedupe modules
jest.mock('../src/dedupe/parser');
jest.mock('../src/dedupe/validator');
jest.mock('../src/dedupe/engine');
jest.mock('../src/dedupe/logger');
jest.mock('../src/dedupe/output');

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn()
}));

describe('Processor', () => {
  let processor: Processor;
  let tempDir: string;
  let mockConfig: CliConfig;
  let progressMessages: string[] = [];

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'processor-test-'));
    
    mockConfig = {
      inputFiles: ['test.json'],
      outputFile: 'output.json',
      logFile: 'log.json',
      timestampKey: 'entryDate',
      verbose: false,
      quiet: false,
      dryRun: false,
      help: false,
      version: false
    };

    progressMessages = [];
    const progressCallback: ProgressCallback = (message: string) => {
      progressMessages.push(message);
    };

    processor = new Processor(mockConfig, progressCallback);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('basic functionality', () => {
    test('should create processor instance', () => {
      expect(processor).toBeInstanceOf(Processor);
    });

    test('should accept progress callback', () => {
      const callback = jest.fn();
      const processorWithCallback = new Processor(mockConfig, callback);
      expect(processorWithCallback).toBeInstanceOf(Processor);
    });
  });

  describe('processing workflow', () => {
    test('should handle successful processing', async () => {
      // Mock successful parsing
      const mockRecords = [
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

      // Mock file system
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock JsonParser
      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      // Mock RecordValidator
      const { RecordValidator } = require('../src/dedupe/validator');
      RecordValidator.createDefaultValidator.mockReturnValue({
        validateRecords: jest.fn().mockReturnValue({ isValid: true })
      });

      // Mock DeduplicationEngine
      const { DeduplicationEngine } = require('../src/dedupe/engine');
      const mockEngine = {
        addRecords: jest.fn(),
        detectConflicts: jest.fn().mockReturnValue([]),
        detectCrossConflicts: jest.fn().mockReturnValue([]),
        resolveConflicts: jest.fn().mockReturnValue([]),
        deduplicate: jest.fn().mockReturnValue({ 
          uniqueRecords: mockRecords,
          conflicts: [],
          crossConflicts: [],
          summary: { totalRecords: 2, uniqueRecords: 2, conflictsResolved: 0, crossConflictsFound: 0 }
        })
      };
      DeduplicationEngine.mockImplementation(() => mockEngine);

      // Mock ChangeLogger
      const { ChangeLogger } = require('../src/dedupe/logger');
      const mockLogger = {
        logMergeDecisions: jest.fn()
      };
      ChangeLogger.mockImplementation(() => mockLogger);

      // Mock OutputManager
      const { OutputManager } = require('../src/dedupe/output');
      const mockOutputManager = {
        generateDefaultOutputFilename: jest.fn().mockReturnValue('test_deduplicated_2024-01-15T10-30-00.json'),
        writeOutputAndLog: jest.fn().mockReturnValue({
          success: true,
          outputFile: 'output.json',
          logFile: 'log.json'
        })
      };
      OutputManager.mockImplementation(() => mockOutputManager);

      const result = await processor.process();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain('Successfully processed 2 records');
      expect(result.statistics).toBeDefined();
      expect(result.statistics!.inputRecords).toBe(2);
      expect(result.statistics!.outputRecords).toBe(2);
    });

    test('should handle file not found error', async () => {
      // Mock file system to return false
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await processor.process();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(2);
      expect(result.error).toContain('Input file not found');
    });

    test('should handle validation errors', async () => {
      // Mock successful parsing
      const mockRecords = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      // Mock file system
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock JsonParser
      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      // Mock RecordValidator with validation errors
      const { RecordValidator } = require('../src/dedupe/validator');
      const mockValidator = {
        validateRecords: jest.fn().mockReturnValue({ 
          isValid: false,
          totalErrors: 1,
          errors: [{ type: 'missing_field', field: 'email', message: 'Missing email field' }]
        }),
        getErrorReport: jest.fn().mockReturnValue('Validation failed: Missing email field')
      };
      RecordValidator.createDefaultValidator.mockReturnValue(mockValidator);

      const result = await processor.process();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Validation failed');
    });

    test.skip('should handle cross-conflicts successfully', async () => {
      // Mock successful parsing and validation
      const mockRecords = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      // Mock file system
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock JsonParser
      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      // Mock RecordValidator
      const { RecordValidator } = require('../src/dedupe/validator');
      const mockValidator = {
        validateRecords: jest.fn().mockReturnValue({ isValid: true })
      };
      RecordValidator.createDefaultValidator.mockReturnValue(mockValidator);

      // Mock DeduplicationEngine with cross-conflicts
      const { DeduplicationEngine } = require('../src/dedupe/engine');
      const mockEngine = {
        addRecords: jest.fn(),
        detectConflicts: jest.fn().mockReturnValue([]),
        detectCrossConflicts: jest.fn().mockReturnValue([{ type: 'cross_conflict', records: [] }]),
        resolveConflicts: jest.fn().mockReturnValue([]),
        deduplicate: jest.fn().mockReturnValue({
          uniqueRecords: mockRecords,
          conflicts: [],
          crossConflicts: [{ type: 'cross_conflict', records: [] }],
          summary: { totalRecords: 1, uniqueRecords: 1, conflictsResolved: 0, crossConflictsFound: 1 }
        })
      };
      DeduplicationEngine.mockImplementation(() => mockEngine);

      // Mock ChangeLogger
      const { ChangeLogger } = require('../src/dedupe/logger');
      const mockLogger = {
        logMergeDecisions: jest.fn()
      };
      ChangeLogger.mockImplementation(() => mockLogger);

      // Mock OutputManager
      const { OutputManager } = require('../src/dedupe/output');
      const mockOutputManager = {
        generateDefaultOutputFilename: jest.fn().mockReturnValue('test_deduplicated_2024-01-15T10-30-00.json'),
        writeOutputAndLog: jest.fn().mockReturnValue({
          success: true,
          outputFile: 'output.json',
          logFile: 'log.json'
        })
      };
      OutputManager.mockImplementation(() => mockOutputManager);

      const result = await processor.process();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    test('should handle output file errors', async () => {
      // Mock successful parsing, validation, and deduplication
      const mockRecords = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      // Mock file system
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock JsonParser
      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      // Mock RecordValidator
      const { RecordValidator } = require('../src/dedupe/validator');
      const mockValidator = {
        validateRecords: jest.fn().mockReturnValue({ isValid: true })
      };
      RecordValidator.createDefaultValidator.mockReturnValue(mockValidator);

      // Mock DeduplicationEngine
      const { DeduplicationEngine } = require('../src/dedupe/engine');
      const mockEngine = {
        addRecords: jest.fn(),
        detectConflicts: jest.fn().mockReturnValue([]),
        detectCrossConflicts: jest.fn().mockReturnValue([]),
        resolveConflicts: jest.fn().mockReturnValue([]),
        deduplicate: jest.fn().mockReturnValue({ 
          uniqueRecords: mockRecords,
          conflicts: [],
          crossConflicts: [],
          summary: { totalRecords: 1, uniqueRecords: 1, conflictsResolved: 0, crossConflictsFound: 0 }
        })
      };
      DeduplicationEngine.mockImplementation(() => mockEngine);

      // Mock ChangeLogger
      const { ChangeLogger } = require('../src/dedupe/logger');
      const mockLogger = {
        logMergeDecisions: jest.fn()
      };
      ChangeLogger.mockImplementation(() => mockLogger);

      // Mock OutputManager with error
      const { OutputManager } = require('../src/dedupe/output');
      const mockOutputManager = {
        generateDefaultOutputFilename: jest.fn().mockReturnValue('test_deduplicated_2024-01-15T10-30-00.json'),
        writeOutputAndLog: jest.fn().mockReturnValue({
          success: false,
          error: 'Permission denied'
        })
      };
      OutputManager.mockImplementation(() => mockOutputManager);

      const result = await processor.process();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(2);
      expect(result.error).toContain('Error writing output files');
    });
  });

  describe('progress reporting', () => {
    test('should report progress with callback', async () => {
      // Mock successful processing
      const mockRecords = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      const { RecordValidator } = require('../src/dedupe/validator');
      RecordValidator.createDefaultValidator.mockReturnValue({
        validateRecords: jest.fn().mockReturnValue({ isValid: true })
      });

      const { DeduplicationEngine } = require('../src/dedupe/engine');
      const mockEngine = {
        addRecords: jest.fn(),
        detectConflicts: jest.fn().mockReturnValue([]),
        detectCrossConflicts: jest.fn().mockReturnValue([]),
        resolveConflicts: jest.fn().mockReturnValue([]),
        deduplicate: jest.fn().mockReturnValue({ 
          uniqueRecords: mockRecords,
          conflicts: [],
          crossConflicts: [],
          summary: { totalRecords: 1, uniqueRecords: 1, conflictsResolved: 0, crossConflictsFound: 0 }
        })
      };
      DeduplicationEngine.mockImplementation(() => mockEngine);

      const { ChangeLogger } = require('../src/dedupe/logger');
      const mockLogger = {
        logMergeDecisions: jest.fn()
      };
      ChangeLogger.mockImplementation(() => mockLogger);

      const { OutputManager } = require('../src/dedupe/output');
      const mockOutputManager = {
        generateDefaultOutputFilename: jest.fn().mockReturnValue('test_deduplicated_2024-01-15T10-30-00.json'),
        writeOutputAndLog: jest.fn().mockReturnValue({
          success: true,
          outputFile: 'output.json',
          logFile: 'log.json'
        })
      };
      OutputManager.mockImplementation(() => mockOutputManager);

      await processor.process();

      expect(progressMessages.length).toBeGreaterThan(0);
      expect(progressMessages.some(msg => msg.includes('Starting deduplication process'))).toBe(true);
      expect(progressMessages.some(msg => msg.includes('Parsing input files'))).toBe(true);
      expect(progressMessages.some(msg => msg.includes('Validation completed'))).toBe(true);
      expect(progressMessages.some(msg => msg.includes('Processing completed successfully'))).toBe(true);
    });

    test('should report progress in verbose mode', async () => {
      const verboseConfig = { ...mockConfig, verbose: true };
      const verboseProcessor = new Processor(verboseConfig);

      // Mock successful processing
      const mockRecords = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      const { RecordValidator } = require('../src/dedupe/validator');
      RecordValidator.createDefaultValidator.mockReturnValue({
        validateRecords: jest.fn().mockReturnValue({ isValid: true })
      });

      const { DeduplicationEngine } = require('../src/dedupe/engine');
      const mockEngine = {
        addRecords: jest.fn(),
        detectConflicts: jest.fn().mockReturnValue([]),
        detectCrossConflicts: jest.fn().mockReturnValue([]),
        resolveConflicts: jest.fn().mockReturnValue([]),
        deduplicate: jest.fn().mockReturnValue({ records: mockRecords })
      };
      DeduplicationEngine.mockImplementation(() => mockEngine);

      const { ChangeLogger } = require('../src/dedupe/logger');
      const mockLogger = {
        logMergeDecisions: jest.fn()
      };
      ChangeLogger.mockImplementation(() => mockLogger);

      const { OutputManager } = require('../src/dedupe/output');
      const mockOutputManager = {
        generateDefaultOutputFilename: jest.fn().mockReturnValue('test_deduplicated_2024-01-15T10-30-00.json'),
        writeOutputAndLog: jest.fn().mockReturnValue({
          success: true,
          outputFile: 'output.json',
          logFile: 'log.json'
        })
      };
      OutputManager.mockImplementation(() => mockOutputManager);

      // Mock console.log to capture verbose output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await verboseProcessor.process();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('statistics generation', () => {
    test('should generate correct statistics for successful processing', async () => {
      const mockRecords = [
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

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const { JsonParser } = require('../src/dedupe/parser');
      JsonParser.parseFile.mockReturnValue(mockRecords);

      const { RecordValidator } = require('../src/dedupe/validator');
      RecordValidator.createDefaultValidator.mockReturnValue({
        validateRecords: jest.fn().mockReturnValue({ isValid: true })
      });

      const { DeduplicationEngine } = require('../src/dedupe/engine');
      const mockEngine = {
        addRecords: jest.fn(),
        detectConflicts: jest.fn().mockReturnValue([]),
        detectCrossConflicts: jest.fn().mockReturnValue([]),
        resolveConflicts: jest.fn().mockReturnValue([]),
        deduplicate: jest.fn().mockReturnValue({ 
          uniqueRecords: mockRecords,
          conflicts: [],
          crossConflicts: [],
          summary: { totalRecords: 2, uniqueRecords: 2, conflictsResolved: 0, crossConflictsFound: 0 }
        })
      };
      DeduplicationEngine.mockImplementation(() => mockEngine);

      const { ChangeLogger } = require('../src/dedupe/logger');
      const mockLogger = {
        logMergeDecisions: jest.fn()
      };
      ChangeLogger.mockImplementation(() => mockLogger);

      const { OutputManager } = require('../src/dedupe/output');
      const mockOutputManager = {
        generateDefaultOutputFilename: jest.fn().mockReturnValue('test_deduplicated_2024-01-15T10-30-00.json'),
        writeOutputAndLog: jest.fn().mockReturnValue({
          success: true,
          outputFile: 'output.json',
          logFile: 'log.json'
        })
      };
      OutputManager.mockImplementation(() => mockOutputManager);

      const result = await processor.process();

      expect(result.statistics).toBeDefined();
      expect(result.statistics!.inputRecords).toBe(2);
      expect(result.statistics!.outputRecords).toBe(2);
      expect(result.statistics!.conflicts).toBe(0);
      expect(result.statistics!.changes).toBe(0);
      expect(result.statistics!.outputFile).toBe('output.json');
      expect(result.statistics!.logFile).toBe('log.json');
    });
  });
});
