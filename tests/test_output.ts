import { OutputManager, OutputConfig } from '../src/dedupe/output';
import { ChangeLogger } from '../src/dedupe/logger';
import { LeadRecord } from '../src/dedupe/models';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('OutputManager', () => {
  let outputManager: OutputManager;
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'output-test-'));
    
    const config: OutputConfig = {
      outputDir: tempDir,
      logDir: tempDir,
      createBackup: false,
      atomicWrite: true
    };
    
    outputManager = new OutputManager(config);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('filename generation', () => {
    test('should generate default output filename with timestamp', () => {
      const inputFile = 'leads.json';
      const outputFile = outputManager.generateDefaultOutputFilename(inputFile);
      
      expect(outputFile).toMatch(/^leads_deduplicated_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
      expect(outputFile).toContain('leads_deduplicated_');
      expect(outputFile).toMatch(/\.json$/);
    });

    test('should handle input files with different extensions', () => {
      const inputFile = 'data.csv';
      const outputFile = outputManager.generateDefaultOutputFilename(inputFile);
      
      expect(outputFile).toMatch(/^data_deduplicated_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('should handle input files with paths', () => {
      const inputFile = '/path/to/leads.json';
      const outputFile = outputManager.generateDefaultOutputFilename(inputFile);
      
      expect(outputFile).toMatch(/^leads_deduplicated_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('should generate log filename based on output filename', () => {
      const outputFile = 'leads_deduplicated_2024-01-15T10-30-00.json';
      const logFile = outputManager.generateLogFilename(outputFile);
      
      expect(logFile).toBe('leads_deduplicated_2024-01-15T10-30-00_changes.log.json');
    });
  });

  describe('output file writing', () => {
    test('should write output file successfully', () => {
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

      const result = outputManager.writeOutputFile(records, 'test_output.json');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('test_output.json');
      expect(result.fileSize).toBeGreaterThan(0);

      // Verify file was created
      const outputPath = path.join(tempDir, 'test_output.json');
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify file content
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('leads');
      expect(parsed.leads).toHaveLength(2);
    });

    test('should generate default filename when not provided', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const result = outputManager.writeOutputFile(records, undefined, 'leads.json');

      expect(result.success).toBe(true);
      expect(result.outputFile).toMatch(/^leads_deduplicated_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('should handle empty records array', () => {
      const result = outputManager.writeOutputFile([], 'empty_output.json');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('empty_output.json');

      // Verify file content
      const outputPath = path.join(tempDir, 'empty_output.json');
      const content = fs.readFileSync(outputPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.leads).toHaveLength(0);
    });

    test('should create output directory if it does not exist', () => {
      const subDir = path.join(tempDir, 'subdir');
      const config: OutputConfig = {
        outputDir: subDir,
        logDir: tempDir
      };
      const manager = new OutputManager(config);

      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const result = manager.writeOutputFile(records, 'test_output.json');

      expect(result.success).toBe(true);
      expect(fs.existsSync(subDir)).toBe(true);
      expect(fs.existsSync(path.join(subDir, 'test_output.json'))).toBe(true);
    });
  });

  describe('log file writing', () => {
    test('should write log file successfully', () => {
      const logger = new ChangeLogger();
      const result = outputManager.writeLogFile(logger, 'test_output.json');

      expect(result.success).toBe(true);
      expect(result.logFile).toBe('test_output_changes.log.json');
      expect(result.fileSize).toBeGreaterThan(0);

      // Verify log file was created
      const logPath = path.join(tempDir, 'test_output_changes.log.json');
      expect(fs.existsSync(logPath)).toBe(true);

      // Verify log file content
      const content = fs.readFileSync(logPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('entries');
    });

    test('should write log file with actual changes', () => {
      const logger = new ChangeLogger();
      
      // Add some test data to logger
      const testRecord = new LeadRecord({
        _id: 'test1',
        email: 'test@example.com',
        entryDate: '2014-05-07T17:30:20+00:00'
      });
      
      // Mock a merge decision (simplified for testing)
      const mockDecision = {
        keptRecord: testRecord,
        droppedRecord: testRecord,
        reason: 'newer_date' as const,
        conflictType: 'id_conflict' as const
      };
      
      logger.logMergeDecision(mockDecision as any);

      const result = outputManager.writeLogFile(logger, 'test_output.json');

      expect(result.success).toBe(true);
      expect(result.logFile).toBe('test_output_changes.log.json');

      // Verify log file content has entries
      const logPath = path.join(tempDir, 'test_output_changes.log.json');
      const content = fs.readFileSync(logPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.entries).toHaveLength(1);
    });
  });

  describe('combined output and log writing', () => {
    test('should write both output and log files', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const logger = new ChangeLogger();
      const result = outputManager.writeOutputAndLog(records, logger, 'test_output.json');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('test_output.json');
      expect(result.logFile).toBe('test_output_changes.log.json');

      // Verify both files were created
      const outputPath = path.join(tempDir, 'test_output.json');
      const logPath = path.join(tempDir, 'test_output_changes.log.json');
      
      expect(fs.existsSync(outputPath)).toBe(true);
      expect(fs.existsSync(logPath)).toBe(true);
    });

    test('should handle output file failure', () => {
      // Create manager with invalid output directory
      const invalidConfig: OutputConfig = {
        outputDir: '/invalid/path/that/does/not/exist',
        logDir: tempDir
      };
      const invalidManager = new OutputManager(invalidConfig);

      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const logger = new ChangeLogger();
      const result = invalidManager.writeOutputAndLog(records, logger, 'test_output.json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('atomic writing', () => {
    test('should write files atomically by default', () => {
      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const result = outputManager.writeOutputFile(records, 'atomic_test.json');

      expect(result.success).toBe(true);

      // Verify no temporary file remains
      const tempFile = path.join(tempDir, 'atomic_test.json.tmp');
      expect(fs.existsSync(tempFile)).toBe(false);
    });

    test('should create backup when configured', () => {
      const backupConfig: OutputConfig = {
        outputDir: tempDir,
        logDir: tempDir,
        createBackup: true,
        atomicWrite: true
      };
      const backupManager = new OutputManager(backupConfig);

      // Create initial file
      const initialRecords = [
        new LeadRecord({
          _id: 'initial',
          email: 'initial@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      backupManager.writeOutputFile(initialRecords, 'backup_test.json');

      // Write new content (should create backup)
      const newRecords = [
        new LeadRecord({
          _id: 'new',
          email: 'new@example.com',
          entryDate: '2014-05-07T17:31:20+00:00'
        })
      ];

      const result = backupManager.writeOutputFile(newRecords, 'backup_test.json');

      expect(result.success).toBe(true);

      // Verify backup was created
      const backupFile = path.join(tempDir, 'backup_test.json.backup');
      expect(fs.existsSync(backupFile)).toBe(true);
    });
  });

  describe('utility methods', () => {
    test('should format file size correctly', () => {
      expect(outputManager.formatFileSize(1024)).toBe('1.0 KB');
      expect(outputManager.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(outputManager.formatFileSize(500)).toBe('500.0 B');
      expect(outputManager.formatFileSize(1536)).toBe('1.5 KB');
    });

    test('should validate output filename', () => {
      expect(outputManager.validateOutputFilename('valid.json')).toEqual({ isValid: true });
      expect(outputManager.validateOutputFilename('')).toEqual({ 
        isValid: false, 
        error: 'Output filename cannot be empty' 
      });
      expect(outputManager.validateOutputFilename('invalid.txt')).toEqual({ 
        isValid: false, 
        error: 'Output filename must end with .json' 
      });
      expect(outputManager.validateOutputFilename('../invalid.json')).toEqual({ 
        isValid: false, 
        error: 'Output filename cannot contain path separators' 
      });
    });

    test('should check file existence', () => {
      const testFile = path.join(tempDir, 'test_file.txt');
      
      expect(outputManager.fileExists(testFile)).toBe(false);
      
      fs.writeFileSync(testFile, 'test content');
      expect(outputManager.fileExists(testFile)).toBe(true);
    });

    test('should get file information', () => {
      const testFile = path.join(tempDir, 'test_file.txt');
      fs.writeFileSync(testFile, 'test content');

      const fileInfo = outputManager.getFileInfo(testFile);
      
      expect(fileInfo).not.toBeNull();
      expect(fileInfo!.size).toBeGreaterThan(0);
      expect(typeof fileInfo!.modified).toBe('object');
      expect(fileInfo!.modified).toHaveProperty('getTime');
    });

    test('should return null for non-existent file', () => {
      const nonExistentFile = path.join(tempDir, 'non_existent.txt');
      const fileInfo = outputManager.getFileInfo(nonExistentFile);
      
      expect(fileInfo).toBeNull();
    });

    test('should get output and log directories', () => {
      expect(outputManager.getOutputDir()).toBe(tempDir);
      expect(outputManager.getLogDir()).toBe(tempDir);
    });
  });

  describe('error handling', () => {
    test('should handle write errors gracefully', () => {
      // Create manager with read-only directory
      const readOnlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readOnlyDir, { mode: 0o444 }); // Read-only

      const readOnlyConfig: OutputConfig = {
        outputDir: readOnlyDir,
        logDir: tempDir
      };
      const readOnlyManager = new OutputManager(readOnlyConfig);

      const records = [
        new LeadRecord({
          _id: 'test1',
          email: 'test1@example.com',
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      ];

      const result = readOnlyManager.writeOutputFile(records, 'test_output.json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Clean up read-only directory
      fs.rmSync(readOnlyDir, { recursive: true, force: true });
    });

    test('should handle invalid JSON data', () => {
      // This test ensures the manager can handle various data types
      const records = [
        { _id: 'test1', email: 'test1@example.com', entryDate: '2014-05-07T17:30:20+00:00' },
        { _id: 'test2', email: 'test2@example.com', entryDate: '2014-05-07T17:31:20+00:00' }
      ];

      const result = outputManager.writeOutputFile(records, 'test_output.json');

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe('test_output.json');
    });
  });
});
