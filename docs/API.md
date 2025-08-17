# API Documentation

This document provides detailed API reference for the JSON Deduplication Tool library.

## Table of Contents

- [Core Classes](#core-classes)
- [Data Models](#data-models)
- [Performance Classes](#performance-classes)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Examples](#examples)

## Core Classes

### LeadRecord

Represents a single lead record with validation and serialization capabilities.

#### Constructor

```typescript
constructor(data: LeadRecordData)
```

#### Properties

- `_id: string` - Unique identifier
- `email: string` - Email address
- `entryDate: string` - Date field for conflict resolution
- `firstName?: string` - Optional first name
- `lastName?: string` - Optional last name
- `address?: string` - Optional address

#### Methods

##### `validate(): ValidationResult`

Validates the record and returns validation result.

```typescript
const record = new LeadRecord({
  _id: 'id1',
  email: 'test@example.com',
  entryDate: '2014-05-07T17:30:20+00:00'
});

const result = record.validate();
if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}
```

##### `toObject(): LeadRecordData`

Converts the record to a plain object.

```typescript
const obj = record.toObject();
// Returns: { _id: 'id1', email: 'test@example.com', ... }
```

##### `clone(): LeadRecord`

Creates a deep copy of the record.

```typescript
const copy = record.clone();
```

### JsonParser

Handles parsing of JSON files and content into LeadRecord objects.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `parseFile(filePath: string): Promise<JsonData>`

Parses a JSON file and returns structured data.

```typescript
const parser = new JsonParser();
const data = await parser.parseFile('leads.json');
console.log(`Parsed ${data.records.length} records`);
```

##### `parseContent(content: string): JsonData`

Parses JSON content string and returns structured data.

```typescript
const content = '{"leads": [...]}';
const data = parser.parseContent(content);
```

### RecordValidator

Validates LeadRecord objects against configurable rules.

#### Constructor

```typescript
constructor(config?: ValidationConfig)
```

#### Methods

##### `validateRecords(records: LeadRecord[]): ValidationSummary`

Validates multiple records and returns summary.

```typescript
const validator = new RecordValidator();
const summary = validator.validateRecords(records);

if (!summary.isValid) {
  console.log(`Found ${summary.errorCount} validation errors`);
  summary.errors.forEach(error => {
    console.log(`- ${error.message}`);
  });
}
```

### DeduplicationEngine

Core deduplication logic with conflict detection and resolution.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `addRecord(record: LeadRecord): void`

Adds a record to the engine for processing.

```typescript
const engine = new DeduplicationEngine();
engine.addRecord(record1);
engine.addRecord(record2);
```

##### `addRecords(records: LeadRecord[]): void`

Adds multiple records to the engine.

```typescript
engine.addRecords(records);
```

##### `clear(): void`

Clears all records from the engine.

```typescript
engine.clear();
```

##### `detectConflicts(): ConflictInfo[]`

Detects all conflicts in the current records.

```typescript
const conflicts = engine.detectConflicts();
conflicts.forEach(conflict => {
  console.log(`Conflict between ${conflict.recordIds.join(' and ')}`);
});
```

##### `resolveConflicts(): DeduplicationResult`

Resolves all conflicts and returns deduplication result.

```typescript
const result = engine.resolveConflicts();
console.log(`Kept ${result.uniqueRecords.length} unique records`);
console.log(`Resolved ${result.conflicts.length} conflicts`);
```

##### `deduplicate(): DeduplicationResult`

Performs complete deduplication (detect + resolve).

```typescript
const result = engine.deduplicate();
```

### ChangeLogger

Tracks and logs all changes during deduplication.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `logMerge(keptRecord: LeadRecord, droppedRecord: LeadRecord, reason: string): void`

Logs a merge decision.

```typescript
const logger = new ChangeLogger();
logger.logMerge(keptRecord, droppedRecord, 'newer_date');
```

##### `getLog(): ChangeLog`

Returns the complete change log.

```typescript
const log = logger.getLog();
console.log(`Processed ${log.summary.totalRecords} records`);
console.log(`Made ${log.summary.changes} changes`);
```

##### `clear(): void`

Clears the change log.

```typescript
logger.clear();
```

### OutputManager

Handles output and log file generation.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `writeOutputFile(records: LeadRecord[], config: OutputConfig): Promise<OutputResult>`

Writes deduplicated records to output file.

```typescript
const outputManager = new OutputManager();
const result = await outputManager.writeOutputFile(records, {
  outputFile: 'output.json',
  createBackup: true
});

if (result.success) {
  console.log(`Output written to ${result.outputFile}`);
}
```

##### `writeLogFile(logger: ChangeLogger, config: OutputConfig): Promise<OutputResult>`

Writes change log to file.

```typescript
const result = await outputManager.writeLogFile(logger, {
  logFile: 'changes.log'
});
```

##### `writeOutputAndLog(records: LeadRecord[], logger: ChangeLogger, config: OutputConfig): Promise<OutputResult>`

Writes both output and log files.

```typescript
const result = await outputManager.writeOutputAndLog(records, logger, {
  outputFile: 'output.json',
  logFile: 'changes.log'
});
```

## Data Models

### LeadRecordData

```typescript
interface LeadRecordData {
  _id: string;
  email: string;
  entryDate: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  [key: string]: any; // Additional fields
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

### ValidationConfig

```typescript
interface ValidationConfig {
  requiredFields?: string[];
  dateFields?: string[];
  allowEmptyValues?: boolean;
}
```

### ValidationSummary

```typescript
interface ValidationSummary {
  isValid: boolean;
  errorCount: number;
  errors: ValidationError[];
}
```

### ValidationError

```typescript
interface ValidationError {
  type: 'missing_field' | 'invalid_date' | 'empty_value';
  field: string;
  message: string;
  recordIndex?: number;
}
```

### ConflictInfo

```typescript
interface ConflictInfo {
  type: 'id' | 'email' | 'cross';
  recordIds: string[];
  records: LeadRecord[];
}
```

### DeduplicationResult

```typescript
interface DeduplicationResult {
  uniqueRecords: LeadRecord[];
  conflicts: ConflictInfo[];
  statistics: {
    totalRecords: number;
    uniqueRecords: number;
    conflicts: number;
  };
}
```

### ChangeLog

```typescript
interface ChangeLog {
  summary: {
    totalRecords: number;
    uniqueRecords: number;
    conflicts: number;
    changes: number;
  };
  changes: LogEntry[];
  metadata: {
    timestamp: string;
    version: string;
    inputFiles: string[];
    outputFile?: string;
  };
}
```

### LogEntry

```typescript
interface LogEntry {
  type: 'merge';
  keptRecord: {
    _id: string;
    email: string;
  };
  droppedRecord: {
    _id: string;
    email: string;
  };
  reason: string;
  fieldChanges: Record<string, any>;
}
```

### OutputConfig

```typescript
interface OutputConfig {
  outputFile?: string;
  logFile?: string;
  createBackup?: boolean;
  prettyPrint?: boolean;
}
```

### OutputResult

```typescript
interface OutputResult {
  success: boolean;
  outputFile?: string;
  logFile?: string;
  error?: string;
  fileSize?: number;
}
```

## Performance Classes

### PerformanceMonitor

Tracks performance metrics during processing.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `start(): void`

Starts performance monitoring.

```typescript
const monitor = new PerformanceMonitor();
monitor.start();
```

##### `updateMemoryUsage(): void`

Updates peak memory usage tracking.

```typescript
monitor.updateMemoryUsage();
```

##### `stop(recordCount: number): PerformanceMetrics`

Stops monitoring and returns metrics.

```typescript
const metrics = monitor.stop(1000);
console.log(`Processed ${metrics.recordCount} records in ${metrics.duration}ms`);
console.log(`Rate: ${metrics.processingRate} records/sec`);
```

#### Static Methods

##### `formatMemory(bytes: number): string`

Formats memory size in human-readable format.

```typescript
const formatted = PerformanceMonitor.formatMemory(1024 * 1024);
// Returns: "1.0 MB"
```

##### `formatDuration(milliseconds: number): string`

Formats duration in human-readable format.

```typescript
const formatted = PerformanceMonitor.formatDuration(65000);
// Returns: "1m 5.0s"
```

##### `formatProcessingRate(rate: number): string`

Formats processing rate in human-readable format.

```typescript
const formatted = PerformanceMonitor.formatProcessingRate(1500);
// Returns: "1.5k records/sec"
```

### MemoryManager

Manages memory usage and batch processing.

#### Static Methods

##### `checkMemoryUsage(): { isAcceptable: boolean; usage: number; threshold: number }`

Checks current memory usage.

```typescript
const memoryCheck = MemoryManager.checkMemoryUsage();
if (!memoryCheck.isAcceptable) {
  console.warn(`Memory usage: ${(memoryCheck.usage * 100).toFixed(1)}%`);
}
```

##### `processInBatches<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, batchSize?: number): Promise<R[]>`

Processes items in batches with memory management.

```typescript
const results = await MemoryManager.processInBatches(
  records,
  async (batch) => {
    // Process batch
    return processedBatch;
  },
  5000 // batch size
);
```

##### `forceGarbageCollection(): void`

Forces garbage collection if available.

```typescript
MemoryManager.forceGarbageCollection();
```

##### `getMemoryStats(): { heapUsed: number; heapTotal: number; external: number; rss: number; usageRatio: number }`

Gets detailed memory statistics.

```typescript
const stats = MemoryManager.getMemoryStats();
console.log(`Heap usage: ${stats.usageRatio * 100}%`);
```

### TimeoutManager

Manages timeouts for long-running operations.

#### Static Methods

##### `withTimeout<T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T>`

Executes a function with timeout.

```typescript
const result = await TimeoutManager.withTimeout(
  async () => {
    // Long-running operation
    return result;
  },
  300000 // 5 minutes
);
```

##### `shouldAbort(startTime: number, timeoutMs: number): boolean`

Checks if operation should be aborted due to timeout.

```typescript
const startTime = Date.now();
while (processing) {
  if (TimeoutManager.shouldAbort(startTime, 300000)) {
    break;
  }
  // Continue processing
}
```

### DatasetOptimizer

Optimizes processing for large datasets.

#### Static Methods

##### `optimizeForLargeDataset(records: LeadRecord[]): { shouldUseBatching: boolean; batchSize: number; estimatedMemoryUsage: number }`

Determines optimization strategy for dataset.

```typescript
const optimization = DatasetOptimizer.optimizeForLargeDataset(records);
if (optimization.shouldUseBatching) {
  console.log(`Using batch size: ${optimization.batchSize}`);
}
```

##### `processRecordsWithProgress<T, R>(records: T[], processor: (batch: T[]) => Promise<R[]>, progressCallback?: (current: number, total: number, percentage: number) => void, batchSize?: number): Promise<R[]>`

Processes records with progress reporting.

```typescript
const results = await DatasetOptimizer.processRecordsWithProgress(
  records,
  async (batch) => processedBatch,
  (current, total, percentage) => {
    console.log(`Progress: ${percentage.toFixed(1)}%`);
  },
  5000
);
```

## Error Handling

### Custom Errors

The library defines several custom error types:

```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string, public recordIndex?: number) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DeduplicationError extends Error {
  constructor(message: string, public conflictType: string) {
    super(message);
    this.name = 'DeduplicationError';
  }
}

class ProcessingError extends Error {
  constructor(message: string, public exitCode: number) {
    super(message);
    this.name = 'ProcessingError';
  }
}
```

### Error Handling Example

```typescript
try {
  const result = await processor.process();
  console.log('Processing successful');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation error in field ${error.field}: ${error.message}`);
  } else if (error instanceof DeduplicationError) {
    console.error(`Deduplication error: ${error.message}`);
  } else if (error instanceof ProcessingError) {
    console.error(`Processing error (exit code ${error.exitCode}): ${error.message}`);
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Configuration

### Environment Variables

```typescript
// Performance configuration
process.env.MAX_MEMORY_USAGE = '80'; // percentage
process.env.BATCH_SIZE = '10000';
process.env.TIMEOUT_MS = '300000';

// Debug configuration
process.env.DEBUG = '*';
process.env.NODE_ENV = 'development';
```

### Performance Tuning

```typescript
// Increase memory limit
process.env.NODE_OPTIONS = '--max-old-space-size=8192';

// Enable garbage collection
process.env.NODE_OPTIONS = '--expose-gc';
```

## Examples

### Complete Processing Example

```typescript
import { 
  JsonParser, 
  RecordValidator, 
  DeduplicationEngine, 
  ChangeLogger, 
  OutputManager,
  PerformanceMonitor 
} from './dedupe';

async function processLeads(inputFile: string, outputFile: string) {
  const monitor = new PerformanceMonitor();
  monitor.start();

  try {
    // Parse input
    const parser = new JsonParser();
    const data = await parser.parseFile(inputFile);

    // Validate records
    const validator = new RecordValidator();
    const validation = validator.validateRecords(data.records);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errorCount} errors`);
    }

    // Deduplicate
    const engine = new DeduplicationEngine();
    engine.addRecords(data.records);
    const result = engine.deduplicate();

    // Log changes
    const logger = new ChangeLogger();
    result.conflicts.forEach(conflict => {
      // Log each conflict resolution
    });

    // Write output
    const outputManager = new OutputManager();
    await outputManager.writeOutputAndLog(result.uniqueRecords, logger, {
      outputFile,
      logFile: outputFile.replace('.json', '_changes.log')
    });

    const metrics = monitor.stop(result.uniqueRecords.length);
    console.log(`Processed ${result.uniqueRecords.length} records in ${metrics.duration}ms`);

  } catch (error) {
    console.error('Processing failed:', error.message);
    throw error;
  }
}
```

### Batch Processing Example

```typescript
import { MemoryManager, DatasetOptimizer } from './performance';

async function processLargeDataset(records: LeadRecord[]) {
  const optimization = DatasetOptimizer.optimizeForLargeDataset(records);
  
  if (optimization.shouldUseBatching) {
    console.log(`Processing ${records.length} records in batches of ${optimization.batchSize}`);
    
    const results = await MemoryManager.processInBatches(
      records,
      async (batch) => {
        // Process each batch
        const engine = new DeduplicationEngine();
        engine.addRecords(batch);
        return engine.deduplicate().uniqueRecords;
      },
      optimization.batchSize
    );
    
    return results.flat();
  } else {
    // Process all at once for small datasets
    const engine = new DeduplicationEngine();
    engine.addRecords(records);
    return engine.deduplicate().uniqueRecords;
  }
}
```

### Custom Validation Example

```typescript
import { RecordValidator, ValidationConfig } from './dedupe';

const customConfig: ValidationConfig = {
  requiredFields: ['_id', 'email', 'entryDate', 'company'],
  dateFields: ['entryDate', 'lastModified'],
  allowEmptyValues: false
};

const validator = new RecordValidator(customConfig);
const summary = validator.validateRecords(records);

if (!summary.isValid) {
  summary.errors.forEach(error => {
    console.log(`${error.type}: ${error.message} in field ${error.field}`);
  });
}
```

### Performance Monitoring Example

```typescript
import { PerformanceMonitor, MemoryManager } from './performance';

async function monitoredProcessing(records: LeadRecord[]) {
  const monitor = new PerformanceMonitor();
  monitor.start();

  // Process records
  const engine = new DeduplicationEngine();
  engine.addRecords(records);
  const result = engine.deduplicate();

  // Check memory usage
  const memoryCheck = MemoryManager.checkMemoryUsage();
  if (!memoryCheck.isAcceptable) {
    console.warn(`High memory usage: ${(memoryCheck.usage * 100).toFixed(1)}%`);
  }

  const metrics = monitor.stop(result.uniqueRecords.length);
  
  console.log('Performance Summary:');
  console.log(`- Duration: ${PerformanceMonitor.formatDuration(metrics.duration)}`);
  console.log(`- Processing Rate: ${PerformanceMonitor.formatProcessingRate(metrics.processingRate)}`);
  console.log(`- Memory Used: ${PerformanceMonitor.formatMemory(metrics.memoryUsage.peak)}`);
  console.log(`- Memory Efficiency: ${PerformanceMonitor.formatMemory(metrics.memoryEfficiency)} per record`);

  return result;
}
```

This API documentation provides comprehensive coverage of all public interfaces and usage patterns for the JSON Deduplication Tool library.
