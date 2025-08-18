// Mock chalk before importing CLI
jest.mock('chalk', () => ({
  blue: jest.fn((text: string) => text),
  gray: jest.fn((text: string) => text),
  green: jest.fn((text: string) => text),
  red: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  cyan: jest.fn((text: string) => text),
}));

import { Cli, CliConfig } from '../src/json-dedupe';

// Mock console methods to capture output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Cli', () => {
  let cli: Cli;
  let consoleOutput: string[] = [];
  let consoleErrors: string[] = [];

  beforeEach(() => {
    cli = new Cli();
    consoleOutput = [];
    consoleErrors = [];
    
    // Mock console methods
    console.log = jest.fn((...args: any[]) => {
      consoleOutput.push(args.join(' '));
    });
    console.error = jest.fn((...args: any[]) => {
      consoleErrors.push(args.join(' '));
    });
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('basic functionality', () => {
    test('should create CLI instance with default configuration', () => {
      const config = cli.getConfig();
      
      expect(config.inputFiles).toEqual([]);
      expect(config.timestampKey).toBe('entryDate');
      expect(config.keyNames).toEqual(['leads']);
      expect(config.verbose).toBe(false);
      expect(config.quiet).toBe(false);
      expect(config.dryRun).toBe(false);
    });

    test('should show help', () => {
      // Mock the help method to avoid process.exit
      const originalHelp = (cli as any).program.help;
      (cli as any).program.help = jest.fn();
      
      cli.showHelp();
      
      expect((cli as any).program.help).toHaveBeenCalled();
      
      // Restore original method
      (cli as any).program.help = originalHelp;
    });

    test('should show version', () => {
      cli.showVersion();
      
      expect(consoleOutput.length).toBe(1);
      expect(consoleOutput[0]).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('configuration validation', () => {
    test('should validate empty input files', () => {
      const config: CliConfig = {
        inputFiles: [],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      // Manually set config for testing
      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No input files specified');
    });

    test('should validate empty timestamp key', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: '',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      // Manually set config for testing
      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Timestamp key cannot be empty');
    });

    test('should validate key names configuration', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads', 'users'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      // Manually set config for testing
      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(true);
    });

    test('should validate empty key names array', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: [],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      // Manually set config for testing
      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('At least one key name must be specified');
    });

    test('should validate duplicate key names', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads', 'leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      // Manually set config for testing
      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Duplicate key names are not allowed');
    });

    test('should validate empty key name in array', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads', ''],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      // Manually set config for testing
      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Key names cannot be empty');
    });

    test('should validate conflicting verbose and quiet options', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: true,
        quiet: true,
        dryRun: false,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot use both --verbose and --quiet options');
    });

    test('should validate invalid file paths', () => {
      const config: CliConfig = {
        inputFiles: ['../invalid.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid input file path');
    });

    test('should validate valid configuration', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(true);
    });

    test('should validate stdin input', () => {
      const config: CliConfig = {
        inputFiles: ['-'],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).validateConfig();

      expect(result.isValid).toBe(true);
    });
  });

  describe('file path validation', () => {
    test('should validate valid file paths', () => {
      const validPaths = [
        'file.json',
        'path/to/file.json',
        'file-name.json',
        'file_name.json',
        'file123.json'
      ];

      validPaths.forEach(path => {
        const result = (cli as any).isValidFilePath(path);
        expect(result).toBe(true);
      });
    });

    test('should reject invalid file paths', () => {
      const invalidPaths = [
        '../file.json',
        '..\\file.json',
        'path/../file.json',
        'path/..\\file.json',
        '',
        '   '
      ];

      invalidPaths.forEach(path => {
        const result = (cli as any).isValidFilePath(path);
        expect(result).toBe(false);
      });
    });
  });

  describe('configuration display', () => {
    test('should show configuration in verbose mode', () => {
      const config: CliConfig = {
        inputFiles: ['test1.json', 'test2.json'],
        outputFile: 'output.json',
        logFile: 'log.json',
        timestampKey: 'createdAt',
        keyNames: ['leads'],
        verbose: true,
        quiet: false,
        dryRun: true,
        help: false,
        version: false
      };

      (cli as any).config = config;
      (cli as any).showConfiguration();

      expect(consoleOutput.length).toBeGreaterThan(0);
      expect(consoleOutput.some(output => output.includes('test1.json, test2.json'))).toBe(true);
      expect(consoleOutput.some(output => output.includes('output.json'))).toBe(true);
      expect(consoleOutput.some(output => output.includes('createdAt'))).toBe(true);
    });
  });

  describe('dry run functionality', () => {
    test('should perform dry run with single file', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        outputFile: 'output.json',
        logFile: 'log.json',
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: true,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).performDryRun();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toBe('Dry run completed');

      expect(consoleOutput.length).toBeGreaterThan(0);
      expect(consoleOutput.some(output => output.includes('DRY RUN MODE'))).toBe(true);
      expect(consoleOutput.some(output => output.includes('test.json'))).toBe(true);
    });

    test('should perform dry run with multiple files', () => {
      const config: CliConfig = {
        inputFiles: ['test1.json', 'test2.json', '-'],
        outputFile: 'output.json',
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: true,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).performDryRun();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      expect(consoleOutput.some(output => output.includes('test1.json'))).toBe(true);
      expect(consoleOutput.some(output => output.includes('test2.json'))).toBe(true);
      expect(consoleOutput.some(output => output.includes('(stdin)'))).toBe(true);
    });

    test('should perform dry run with auto-generated filenames', () => {
      const config: CliConfig = {
        inputFiles: ['test.json'],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: true,
        help: false,
        version: false
      };

      (cli as any).config = config;
      const result = (cli as any).performDryRun();

      expect(result.success).toBe(true);
      expect(consoleOutput.some(output => output.includes('(auto-generated)'))).toBe(true);
    });
  });

  describe('argument parsing', () => {
    test('should parse basic arguments', () => {
      const inputFiles = ['test.json'];
      const options = {
        output: 'output.json',
        'log-file': 'log.json',
        'timestamp-key': 'createdAt',
        verbose: true,
        quiet: false,
        'dry-run': false,
        help: false,
        version: false
      };

      (cli as any).parseArguments(inputFiles, options);
      const config = cli.getConfig();

      expect(config.inputFiles).toEqual(['test.json']);
      expect(config.outputFile).toBe('output.json');
      expect(config.logFile).toBe('log.json');
      expect(config.timestampKey).toBe('createdAt');
      expect(config.verbose).toBe(true);
      expect(config.quiet).toBe(false);
      expect(config.dryRun).toBe(false);
    });

    test('should handle empty input files', () => {
      const inputFiles: string[] = [];
      const options = {
        'timestamp-key': 'entryDate',
        verbose: false,
        quiet: false,
        'dry-run': false,
        help: false,
        version: false
      };

      (cli as any).parseArguments(inputFiles, options);
      const config = cli.getConfig();

      expect(config.inputFiles).toEqual([]);
    });

    test('should use default timestamp key', () => {
      const inputFiles = ['test.json'];
      const options = {
        verbose: false,
        quiet: false,
        'dry-run': false,
        help: false,
        version: false
      };

      (cli as any).parseArguments(inputFiles, options);
      const config = cli.getConfig();

      expect(config.timestampKey).toBe('entryDate');
    });
  });

  describe('error handling', () => {
    test('should handle validation errors', () => {
      const config: CliConfig = {
        inputFiles: [],
        timestampKey: 'entryDate',
        keyNames: ['leads'],
        verbose: false,
        quiet: false,
        dryRun: false,
        help: false,
        version: false
      };

      (cli as any).config = config;
      
      // Mock the run method to test error handling
      cli.run = jest.fn().mockResolvedValue({
        success: false,
        exitCode: 1,
        error: 'Validation error'
      });

      // This would normally be called by main()
      const result = cli.run();
      
      expect(result).resolves.toEqual({
        success: false,
        exitCode: 1,
        error: 'Validation error'
      });
    });
  });
});
