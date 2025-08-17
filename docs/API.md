# API Documentation

Core API reference for the JSON Deduplication Tool library.

## Core Classes

### LeadRecord

Represents a single lead record with validation and serialization.

```typescript
constructor(data: LeadRecordData)

// Properties
_id: string          // Unique identifier
email: string        // Email address  
entryDate: string    // Date field for conflict resolution
firstName?: string   // Optional first name
lastName?: string    // Optional last name
address?: string     // Optional address

// Methods
validate(): ValidationResult
toObject(): LeadRecordData
clone(): LeadRecord
```

### JsonParser

Handles parsing of JSON files and content into LeadRecord objects.

```typescript
parseFile(filePath: string): Promise<JsonData>
parseContent(content: string): JsonData
```

### DeduplicationEngine

Core deduplication logic with conflict detection and resolution.

```typescript
addRecord(record: LeadRecord): void
deduplicate(): DeduplicationResult
getConflicts(): Conflict[]
```

### ChangeLogger

Tracks and logs all changes during deduplication.

```typescript
logMerge(keptRecord: LeadRecord, droppedRecord: LeadRecord, reason: string): void
getLog(): ChangeLog
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
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
```

### DeduplicationResult

```typescript
interface DeduplicationResult {
  records: LeadRecord[];
  conflicts: Conflict[];
  summary: DeduplicationSummary;
}
```

## Performance Classes

### PerformanceMonitor

Tracks performance metrics during processing.

```typescript
start(): void
stop(recordCount: number): PerformanceMetrics
```

### MemoryManager

Manages memory usage and batch processing.

```typescript
checkMemoryUsage(): MemoryInfo
processInBatches<T>(items: T[], processor: (item: T) => Promise<void>): Promise<void>
```

## Error Handling

### ValidationError

```typescript
interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
```

### ProcessingError

```typescript
interface ProcessingError extends Error {
  code: string;
  details?: any;
}
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for optimized performance
- `MAX_MEMORY_USAGE`: Maximum memory usage percentage (default: 80)
- `BATCH_SIZE`: Default batch size for processing (default: 10000)
- `TIMEOUT_MS`: Default timeout for operations (default: 300000)

## Quick Examples

### Basic Usage

```typescript
import { JsonParser, DeduplicationEngine, ChangeLogger } from './dedupe';

const parser = new JsonParser();
const engine = new DeduplicationEngine();
const logger = new ChangeLogger();

const data = await parser.parseFile('input.json');
data.records.forEach(record => engine.addRecord(record));

const result = engine.deduplicate();
console.log(`Processed ${result.records.length} unique records`);
```

### Custom Validation

```typescript
import { LeadRecord } from './dedupe/models';

const record = new LeadRecord({
  _id: 'id1',
  email: 'test@example.com',
  entryDate: '2014-05-07T17:30:20+00:00'
});

const validation = record.validate();
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}
```
