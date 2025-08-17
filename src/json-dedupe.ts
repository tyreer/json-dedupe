#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from './dedupe';
import { Processor } from './processor';

/**
 * CLI configuration interface
 */
export interface CliConfig {
  inputFiles: string[];
  outputFile?: string;
  logFile?: string;
  timestampKey: string;
  verbose: boolean;
  quiet: boolean;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

/**
 * CLI result interface
 */
export interface CliResult {
  success: boolean;
  exitCode: number;
  message?: string | undefined;
  error?: string | undefined;
}

/**
 * Main CLI class
 */
export class Cli {
  private program: Command;
  private config: CliConfig;

  constructor() {
    this.program = new Command();
    this.config = {
      inputFiles: [],
      timestampKey: 'entryDate',
      verbose: false,
      quiet: false,
      dryRun: false,
      help: false,
      version: false
    };
    this.setupProgram();
  }

  /**
   * Setup the command line program
   */
  private setupProgram(): void {
    this.program
      .name('json-dedupe')
      .description('Deduplicate JSON records with comprehensive logging and validation')
      .version(VERSION, '-v, --version')
      .usage('[options] <input-files...>')
      .option('-o, --output <file>', 'Output file (default: input_deduplicated_timestamp.json)')
      .option('-l, --log-file <file>', 'Log file (default: output_changes.log.json)')
      .option('-t, --timestamp-key <key>', 'Timestamp field name (default: entryDate)', 'entryDate')
      .option('-v, --verbose', 'Verbose output')
      .option('-q, --quiet', 'Quiet mode (minimal output)')
      .option('--dry-run', 'Show what would be done without making changes')
      .option('-h, --help', 'Display help information')
      .argument('[input-files...]', 'Input JSON files (use - for stdin)')
      .action((inputFiles: string[], options: any) => {
        this.parseArguments(inputFiles, options);
      });

    // Add examples
    this.program.addHelpText('after', `
Examples:
  $ json-dedupe leads.json
  $ json-dedupe -o output.json leads.json
  $ json-dedupe -v --dry-run leads1.json leads2.json
  $ cat leads.json | json-dedupe -
  $ json-dedupe -t createdAt data.json
  $ json-dedupe -l changes.log.json -o deduplicated.json leads.json

Exit Codes:
  0  Success
  1  Validation errors
  2  I/O errors
  3  General errors

For more information, visit: https://github.com/your-repo/json-dedupe
    `);
  }

  /**
   * Parse command line arguments
   */
  private parseArguments(inputFiles: string[], options: any): void {
    this.config = {
      inputFiles: inputFiles || [],
      outputFile: options.output,
      logFile: options['log-file'],
      timestampKey: options['timestamp-key'] || 'entryDate',
      verbose: options.verbose || false,
      quiet: options.quiet || false,
      dryRun: options['dry-run'] || false,
      help: options.help || false,
      version: options.version || false
    };
  }

  /**
   * Run the CLI
   */
  public async run(): Promise<CliResult> {
    try {
      // Parse arguments
      await this.program.parseAsync();

      // Handle help and version
      if (this.config.help) {
        this.program.help();
        return { success: true, exitCode: 0 };
      }

      if (this.config.version) {
        console.log(`${VERSION}`);
        return { success: true, exitCode: 0 };
      }

      // Validate configuration
      const validationResult = this.validateConfig();
      if (!validationResult.isValid) {
        return {
          success: false,
          exitCode: 1,
          error: validationResult.error ?? undefined
        };
      }

      // Show configuration in verbose mode
      if (this.config.verbose) {
        this.showConfiguration();
      }

      // Perform dry run if requested
      if (this.config.dryRun) {
        return this.performDryRun();
      }

      // Perform actual processing
      return await this.performProcessing();

    } catch (error) {
      return {
        success: false,
        exitCode: 3,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate CLI configuration
   */
  private validateConfig(): { isValid: boolean; error?: string } {
    // Check if input files are provided
    if (this.config.inputFiles.length === 0) {
      return {
        isValid: false,
        error: 'No input files specified. Use --help for usage information.'
      };
    }

    // Validate timestamp key
    if (!this.config.timestampKey || this.config.timestampKey.trim() === '') {
      return {
        isValid: false,
        error: 'Timestamp key cannot be empty'
      };
    }

    // Check for conflicting options
    if (this.config.verbose && this.config.quiet) {
      return {
        isValid: false,
        error: 'Cannot use both --verbose and --quiet options'
      };
    }

    // Validate input files (basic check)
    for (const file of this.config.inputFiles) {
      if (file !== '-' && !this.isValidFilePath(file)) {
        return {
          isValid: false,
          error: `Invalid input file path: ${file}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Check if file path is valid
   */
  private isValidFilePath(filePath: string): boolean {
    // Basic validation - can be enhanced
    if (!filePath || filePath.trim() === '') {
      return false;
    }
    
    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('\\')) {
      return false;
    }
    
    // Check for absolute paths (basic check)
    if (filePath.startsWith('/') || filePath.startsWith('\\')) {
      return false;
    }
    
    return true;
  }

  /**
   * Show configuration in verbose mode
   */
  private showConfiguration(): void {
    console.log(chalk.blue('\nConfiguration:'));
    console.log(chalk.gray('  Input files:'), this.config.inputFiles.join(', ') || '(none)');
    console.log(chalk.gray('  Output file:'), this.config.outputFile || '(auto-generated)');
    console.log(chalk.gray('  Log file:'), this.config.logFile || '(auto-generated)');
    console.log(chalk.gray('  Timestamp key:'), this.config.timestampKey);
    console.log(chalk.gray('  Verbose:'), this.config.verbose);
    console.log(chalk.gray('  Quiet:'), this.config.quiet);
    console.log(chalk.gray('  Dry run:'), this.config.dryRun);
    console.log('');
  }

  /**
   * Perform dry run
   */
  private performDryRun(): CliResult {
    console.log(chalk.yellow('\n=== DRY RUN MODE ==='));
    console.log(chalk.gray('No files will be modified.\n'));

    console.log(chalk.blue('Input files to process:'));
    this.config.inputFiles.forEach((file, index) => {
      const marker = file === '-' ? chalk.cyan('(stdin)') : chalk.gray('(file)');
      console.log(`  ${index + 1}. ${file} ${marker}`);
    });

    console.log(chalk.blue('\nOutput configuration:'));
    console.log(`  Output file: ${this.config.outputFile || '(auto-generated)'}`);
    console.log(`  Log file: ${this.config.logFile || '(auto-generated)'}`);
    console.log(`  Timestamp key: ${this.config.timestampKey}`);

    console.log(chalk.blue('\nProcessing options:'));
    console.log(`  Verbose output: ${this.config.verbose ? 'Yes' : 'No'}`);
    console.log(`  Quiet mode: ${this.config.quiet ? 'Yes' : 'No'}`);

    console.log(chalk.green('\nDry run completed successfully.'));
    console.log(chalk.gray('Run without --dry-run to perform actual deduplication.'));

    return {
      success: true,
      exitCode: 0,
      message: 'Dry run completed'
    };
  }

  /**
   * Get configuration
   */
  public getConfig(): CliConfig {
    return { ...this.config };
  }

  /**
   * Display help
   */
  public showHelp(): void {
    console.log(`
JSON Deduplication Tool v${VERSION}

A powerful command-line tool for deduplicating JSON records with comprehensive logging, validation, and performance optimization.

USAGE:
  json-dedupe [options] [files...]

EXAMPLES:
  # Process a single file
  json-dedupe input.json

  # Process multiple files
  json-dedupe file1.json file2.json file3.json

  # Read from stdin
  cat input.json | json-dedupe

  # Specify output and log files
  json-dedupe input.json -o output.json --log-file changes.log

  # Use custom date field
  json-dedupe input.json --timestamp-key createdAt

  # Verbose processing with performance info
  json-dedupe large-file.json --verbose

  # Dry run to see what would be processed
  json-dedupe input.json --dry-run

  # Quiet mode for better performance
  json-dedupe large-file.json --quiet

INPUT FORMAT:
  The tool expects JSON files with the following structure:
  {
    "leads": [
      {
        "_id": "unique-identifier",
        "email": "user@example.com",
        "entryDate": "2014-05-07T17:30:20+00:00",
        "firstName": "John",
        "lastName": "Doe",
        "address": "123 Main St"
      }
    ]
  }

DEDUPLICATION RULES:
  - Records are considered duplicates if they share the same _id or email
  - Conflicts are resolved by preferring records with newer dates
  - If dates are identical, the last record in the input is preferred
  - Cross-conflicts (same email, different IDs) are treated as errors

EXIT CODES:
  0 - Success
  1 - Validation errors (missing fields, invalid dates, etc.)
  2 - I/O errors (file not found, permission denied, etc.)
  3 - General errors (cross-conflicts, processing errors, etc.)

For more information, visit: https://github.com/your-repo/json-dedupe
For troubleshooting, see: docs/TROUBLESHOOTING.md
    `);
    this.program.help();
  }

  /**
   * Display version
   */
  public showVersion(): void {
    console.log(`${VERSION}`);
  }

  /**
   * Perform actual processing
   */
  private async performProcessing(): Promise<CliResult> {
    try {
      const processor = new Processor(this.config);
      const result = await processor.process();

      return {
        success: result.success,
        exitCode: result.exitCode,
        message: result.message,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        exitCode: 3,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const cli = new Cli();
  const result = await cli.run();

  if (!result.success) {
    console.error(chalk.red('Error:'), result.error);
    process.exit(result.exitCode);
  }

  if (result.message && !cli.getConfig().quiet) {
    console.log(chalk.green(result.message));
  }

  process.exit(result.exitCode);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(3);
  });
}

export { main };
