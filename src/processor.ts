import { JsonParser } from './dedupe/parser';
import { RecordValidator } from './dedupe/validator';
import { DeduplicationEngine } from './dedupe/engine';
import { ChangeLogger } from './dedupe/logger';
import { OutputManager } from './dedupe/output';
import { LeadRecord } from './dedupe/models';
import { CliConfig } from './json-dedupe';
import chalk from 'chalk';
import * as fs from 'fs';

/**
 * Processing result interface
 */
export interface ProcessingResult {
  success: boolean;
  exitCode: number;
  message?: string | undefined;
  error?: string | undefined;
  statistics?: {
    inputRecords: number;
    outputRecords: number;
    conflicts: number;
    changes: number;
    outputFile?: string | undefined;
    logFile?: string | undefined;
  } | undefined;
}

/**
 * Progress callback interface
 */
export interface ProgressCallback {
  (message: string, percentage?: number): void;
}

/**
 * Main processor class that integrates all components
 */
export class Processor {
  private config: CliConfig;
  private progressCallback?: ProgressCallback | undefined;

  constructor(config: CliConfig, progressCallback?: ProgressCallback | undefined) {
    this.config = config;
    this.progressCallback = progressCallback ?? undefined;
  }

  /**
   * Process input files and perform deduplication
   */
  public async process(): Promise<ProcessingResult> {
    try {
      this.reportProgress('Starting deduplication process...', 0);

      // Step 1: Parse input files
      this.reportProgress('Parsing input files...', 10);
      const records = await this.parseInputFiles();
      if (!records.success) {
        return {
          success: false,
          exitCode: 2,
          error: records.error ?? undefined
        };
      }

      this.reportProgress(`Parsed ${records.records.length} records`, 20);

      // Step 2: Validate records
      this.reportProgress('Validating records...', 30);
      const validationResult = await this.validateRecords(records.records);
      if (!validationResult.success) {
        return {
          success: false,
          exitCode: 1,
          error: validationResult.error ?? undefined
        };
      }

      this.reportProgress('Validation completed successfully', 40);

      // Step 3: Perform deduplication
      this.reportProgress('Performing deduplication...', 50);
      const deduplicationResult = await this.performDeduplication(records.records);
      if (!deduplicationResult.success) {
        return {
          success: false,
          exitCode: 3,
          error: deduplicationResult.error ?? undefined
        };
      }

      this.reportProgress(`Deduplication completed: ${deduplicationResult.statistics.conflicts} conflicts resolved`, 70);

      // Step 4: Write output files
      this.reportProgress('Writing output files...', 80);
      const outputResult = await this.writeOutputFiles(
        deduplicationResult.records,
        deduplicationResult.logger
      );
      if (!outputResult.success) {
        return {
          success: false,
          exitCode: 2,
          error: outputResult.error ?? undefined
        };
      }

      this.reportProgress('Output files written successfully', 90);

      // Step 5: Generate final statistics
      this.reportProgress('Generating final report...', 95);
      const statistics = this.generateStatistics(
        records.records.length,
        deduplicationResult.records.length,
        deduplicationResult.statistics,
        outputResult
      );

      this.reportProgress('Processing completed successfully!', 100);

      return {
        success: true,
        exitCode: 0,
        message: this.generateSuccessMessage(statistics),
        statistics
      };

    } catch (error) {
      return {
        success: false,
        exitCode: 3,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse input files
   */
  private async parseInputFiles(): Promise<{ success: boolean; records: LeadRecord[]; error?: string }> {
    const allRecords: LeadRecord[] = [];

    for (const inputFile of this.config.inputFiles) {
      try {
        let records: LeadRecord[];

        if (inputFile === '-') {
          // Read from stdin
          records = JsonParser.parseStdin(this.config.keyNames);
        } else {
          // Read from file
          if (!fs.existsSync(inputFile)) {
            return {
              success: false,
              records: [],
              error: `Input file not found: ${inputFile}`
            };
          }
          records = JsonParser.parseFile(inputFile, this.config.keyNames);
        }

        allRecords.push(...records);

        if (this.config.verbose) {
          console.log(chalk.gray(`  Parsed ${records.length} records from ${inputFile === '-' ? 'stdin' : inputFile}`));
        }

      } catch (error) {
        return {
          success: false,
          records: [],
          error: `Error parsing ${inputFile}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    return {
      success: true,
      records: allRecords
    };
  }

  /**
   * Validate records
   */
  private async validateRecords(records: LeadRecord[]): Promise<{ success: boolean; error?: string }> {
    try {
      const validator = RecordValidator.createDefaultValidator();
      const summary = validator.validateRecords(records);

      if (!summary.isValid) {
        const errorReport = validator.getErrorReport(summary);
        return {
          success: false,
          error: `Validation failed:\n${errorReport}`
        };
      }

      if (this.config.verbose) {
        console.log(chalk.gray(`  Validation passed: ${records.length} records`));
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Perform deduplication
   */
  private async performDeduplication(records: LeadRecord[]): Promise<{
    success: boolean;
    records: LeadRecord[];
    logger: ChangeLogger;
    statistics: { conflicts: number; changes: number; crossConflicts?: number };
    error?: string;
  }> {
    try {
      const engine = new DeduplicationEngine();
      const logger = new ChangeLogger();

      // Add records to engine
      engine.addRecords(records);

      // Perform complete deduplication (including cross-conflicts)
      const result = engine.deduplicate();
      const deduplicatedRecords = result.uniqueRecords;
      const allConflicts = result.conflicts;
      const crossConflicts = result.crossConflicts;

      // Log all conflicts that were resolved
      if (crossConflicts.length > 0) {
        logger.logCrossConflicts(crossConflicts);
        if (this.config.verbose) {
          console.log(chalk.yellow(`⚠️  Cross-conflicts detected and resolved: ${crossConflicts.length} groups`));
          crossConflicts.forEach((conflict, index) => {
            if (conflict.details) {
              console.log(chalk.yellow(`   Group ${index + 1}: ID "${conflict.details.recordId}" and email "${conflict.details.email}" conflicts resolved`));
            }
          });
        }
      }

      // Log merge decisions for all resolved conflicts
      const decisions = engine.resolveConflicts(allConflicts);
      logger.logMergeDecisions(decisions);

      if (this.config.verbose) {
        console.log(chalk.gray(`  Conflicts resolved: ${allConflicts.length}`));
        console.log(chalk.gray(`  Records after deduplication: ${deduplicatedRecords.length}`));
      }

      return {
        success: true,
        records: deduplicatedRecords,
        logger,
        statistics: {
          conflicts: allConflicts.length,
          changes: decisions.length,
          crossConflicts: crossConflicts.length
        }
      };

    } catch (error) {
      return {
        success: false,
        records: [],
        logger: new ChangeLogger(),
        statistics: { conflicts: 0, changes: 0 },
        error: `Deduplication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Write output files
   */
  private async writeOutputFiles(
    records: LeadRecord[],
    logger: ChangeLogger
  ): Promise<{ success: boolean; outputFile?: string | undefined; logFile?: string | undefined; error?: string | undefined }> {
    try {
      const outputManager = new OutputManager();

      // Determine output filename
      const inputFile = this.config.inputFiles[0];
      const outputFile = this.config.outputFile || 
        (inputFile && inputFile !== '-' ? outputManager.generateDefaultOutputFilename(inputFile) : 'deduplicated_output.json');

      // Write output and log files
      const result = outputManager.writeOutputAndLog(records, logger, outputFile, inputFile);

      if (!result.success) {
        return {
          success: false,
          error: `Error writing output files: ${result.error}`
        };
      }

      if (this.config.verbose) {
        console.log(chalk.gray(`  Output file: ${result.outputFile}`));
        console.log(chalk.gray(`  Log file: ${result.logFile}`));
      }

      return {
        success: true,
        outputFile: result.outputFile ?? undefined,
        logFile: result.logFile ?? undefined
      };

    } catch (error) {
      return {
        success: false,
        error: `Output error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }



  /**
   * Generate statistics
   */
  private generateStatistics(
    inputCount: number,
    outputCount: number,
    deduplicationStats: { conflicts: number; changes: number; crossConflicts?: number },
    outputResult: { outputFile?: string | undefined; logFile?: string | undefined }
  ) {
          return {
        inputRecords: inputCount,
        outputRecords: outputCount,
        conflicts: deduplicationStats.conflicts,
        changes: deduplicationStats.changes,
        crossConflicts: deduplicationStats.crossConflicts,
        outputFile: outputResult.outputFile ?? undefined,
        logFile: outputResult.logFile ?? undefined
      };
  }

  /**
   * Generate success message
   */
  private generateSuccessMessage(statistics: any): string {
    const reduction = statistics.inputRecords - statistics.outputRecords;
    const reductionPercent = ((reduction / statistics.inputRecords) * 100).toFixed(1);

    let message = `✅ Successfully processed ${statistics.inputRecords} records`;
    
    if (reduction > 0) {
      message += `, removed ${reduction} duplicates (${reductionPercent}% reduction)`;
    } else {
      message += ` (no duplicates found)`;
    }
    
    message += `, output ${statistics.outputRecords} unique records`;
    
    if (statistics.conflicts > 0) {
      message += `\n🔧 Resolved ${statistics.conflicts} conflicts with ${statistics.changes} field changes`;
      
      // Add cross-conflict information if available
      if (statistics.crossConflicts && statistics.crossConflicts > 0) {
        message += `\n⚠️  Including ${statistics.crossConflicts} cross-conflicts resolved by preferring newest dates`;
      }
    } else {
      message += `\n✨ No conflicts detected`;
    }
    
    if (statistics.outputFile) {
      message += `\n📄 Output written to: ${statistics.outputFile}`;
    }
    
    if (statistics.logFile) {
      message += `\n📋 Change log written to: ${statistics.logFile}`;
    }

    return message;
  }

  /**
   * Report progress
   */
  private reportProgress(message: string, percentage?: number): void {
    if (this.progressCallback) {
      this.progressCallback(message, percentage);
    } else if (this.config.verbose) {
      if (percentage !== undefined) {
        console.log(chalk.blue(`[${percentage}%] ${message}`));
      } else {
        console.log(chalk.blue(message));
      }
    }
  }
}
