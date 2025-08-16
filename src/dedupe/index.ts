/**
 * JSON Deduplication Tool
 * 
 * A command-line tool for deduplicating JSON records with comprehensive logging and validation.
 */

export { LeadRecord, LeadRecordData, ValidationResult } from './models';
export { JsonParser, JsonData } from './parser';
export { DateUtils, DateParseOptions, DateParseResult } from './utils';
export { RecordValidator, ValidationConfig, ValidationError, ValidationSummary } from './validator';
export { DeduplicationEngine, ConflictInfo, DeduplicationResult, MergeDecision } from './engine';
export { ChangeLogger, LogEntry, ChangeLog, FieldChange } from './logger';
export { OutputManager, OutputConfig, OutputResult } from './output';

// Version information
export const VERSION = '0.1.0';
export const AUTHOR = 'JSON Deduplication Tool Team';
