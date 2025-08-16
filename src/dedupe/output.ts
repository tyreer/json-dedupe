import * as fs from 'fs';
import * as path from 'path';
import { ChangeLogger } from './logger';

/**
 * Interface for output configuration
 */
export interface OutputConfig {
  outputDir?: string;
  logDir?: string;
  createBackup?: boolean;
  atomicWrite?: boolean;
}

/**
 * Interface for output result
 */
export interface OutputResult {
  success: boolean;
  outputFile?: string | undefined;
  logFile?: string | undefined;
  error?: string | undefined;
  fileSize?: number | undefined;
}

/**
 * Output file management system
 */
export class OutputManager {
  private config: OutputConfig;

  constructor(config: OutputConfig = {}) {
    this.config = {
      outputDir: process.cwd(),
      logDir: process.cwd(),
      createBackup: false,
      atomicWrite: true,
      ...config
    };
  }

  /**
   * Generate default output filename based on input filename
   * @param inputFile - Input filename or path
   * @returns Default output filename with timestamp
   */
  public generateDefaultOutputFilename(inputFile: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const baseName = path.basename(inputFile, path.extname(inputFile));
    return `${baseName}_deduplicated_${timestamp}.json`;
  }

  /**
   * Generate log filename based on output filename
   * @param outputFile - Output filename
   * @returns Log filename
   */
  public generateLogFilename(outputFile: string): string {
    const baseName = path.basename(outputFile, path.extname(outputFile));
    return `${baseName}_changes.log.json`;
  }

  /**
   * Write output file with deduplicated records
   * @param records - Array of deduplicated records
   * @param outputFile - Output filename (optional, will generate default if not provided)
   * @param inputFile - Input filename for default naming
   * @returns Output result
   */
  public writeOutputFile(
    records: any[], 
    outputFile?: string, 
    inputFile?: string
  ): OutputResult {
    try {
      // Generate output filename if not provided
      const finalOutputFile = outputFile || 
        (inputFile ? this.generateDefaultOutputFilename(inputFile) : 'deduplicated_output.json');
      
      const outputPath = path.join(this.config.outputDir!, finalOutputFile);
      
      // Ensure output directory exists
      this.ensureDirectoryExists(path.dirname(outputPath));

      // Prepare output data
      const outputData = {
        leads: records
      };

      // Write file atomically if configured
      if (this.config.atomicWrite) {
        this.writeFileAtomically(outputPath, JSON.stringify(outputData, null, 2));
      } else {
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
      }

      const stats = fs.statSync(outputPath);

      return {
        success: true,
        outputFile: finalOutputFile,
        fileSize: stats.size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Write log file with change information
   * @param logger - Change logger instance
   * @param outputFile - Output filename for log naming
   * @returns Output result
   */
  public writeLogFile(logger: ChangeLogger, outputFile: string): OutputResult {
    try {
      const logFilename = this.generateLogFilename(outputFile);
      const logPath = path.join(this.config.logDir!, logFilename);

      // Ensure log directory exists
      this.ensureDirectoryExists(path.dirname(logPath));

      // Get log data (not used but kept for potential future use)
      logger.getChangeLog();

      // Write log file atomically if configured
      if (this.config.atomicWrite) {
        this.writeFileAtomically(logPath, logger.toJSON(true));
      } else {
        fs.writeFileSync(logPath, logger.toJSON(true), 'utf8');
      }

      const stats = fs.statSync(logPath);

      return {
        success: true,
        logFile: logFilename,
        fileSize: stats.size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Write both output and log files
   * @param records - Array of deduplicated records
   * @param logger - Change logger instance
   * @param outputFile - Output filename (optional)
   * @param inputFile - Input filename for default naming
   * @returns Combined output result
   */
  public writeOutputAndLog(
    records: any[],
    logger: ChangeLogger,
    outputFile?: string,
    inputFile?: string
  ): OutputResult {
    // Write output file first
    const outputResult = this.writeOutputFile(records, outputFile, inputFile);
    
    if (!outputResult.success) {
      return outputResult;
    }

    // Write log file
    const logResult = this.writeLogFile(logger, outputResult.outputFile!);

    return {
      success: outputResult.success && logResult.success,
      outputFile: outputResult.outputFile ?? undefined,
      logFile: logResult.logFile ?? undefined,
      error: logResult.error ?? undefined,
      fileSize: outputResult.fileSize ?? undefined
    };
  }

  /**
   * Ensure directory exists, create if it doesn't
   * @param dirPath - Directory path
   * @private
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Write file atomically using temporary file
   * @param filePath - Target file path
   * @param content - File content
   * @private
   */
  private writeFileAtomically(filePath: string, content: string): void {
    const tempPath = `${filePath}.tmp`;
    
    // Write to temporary file first
    fs.writeFileSync(tempPath, content, 'utf8');
    
    // Create backup if configured
    if (this.config.createBackup && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup`;
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Rename temporary file to target file (atomic operation)
    fs.renameSync(tempPath, filePath);
  }

  /**
   * Get file size in human-readable format
   * @param bytes - File size in bytes
   * @returns Human-readable file size
   */
  public formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Validate output filename
   * @param filename - Filename to validate
   * @returns Validation result
   */
  public validateOutputFilename(filename: string): { isValid: boolean; error?: string } {
    if (!filename || filename.trim() === '') {
      return { isValid: false, error: 'Output filename cannot be empty' };
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return { isValid: false, error: 'Output filename cannot contain path separators' };
    }

    if (!filename.endsWith('.json')) {
      return { isValid: false, error: 'Output filename must end with .json' };
    }

    return { isValid: true };
  }

  /**
   * Get output directory path
   * @returns Output directory path
   */
  public getOutputDir(): string {
    return this.config.outputDir!;
  }

  /**
   * Get log directory path
   * @returns Log directory path
   */
  public getLogDir(): string {
    return this.config.logDir!;
  }

  /**
   * Check if file exists
   * @param filePath - File path to check
   * @returns True if file exists
   */
  public fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Get file information
   * @param filePath - File path
   * @returns File information or null if file doesn't exist
   */
  public getFileInfo(filePath: string): { size: number; modified: Date } | null {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up temporary files
   * @param outputFile - Output file path
   */
  public cleanupTempFiles(outputFile: string): void {
    const tempFile = `${outputFile}.tmp`;
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}
