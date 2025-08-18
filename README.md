# JSON Deduplication CLI

A command-line tool for deduplicating JSON records with comprehensive logging, validation, and performance optimization. Built with TypeScript and Node.js.

**Problem being solved**: You have one or more JSON files with records that have duplicate values for ID or email fields. You need a set of records with unique ID and email values. The tool resolves conflicts by preferring records with the newest date, with last-in-list tie-breaker for identical dates.

> **Development Note**: This tool was created following the prompt-driven development workflow described in [Harper Reed's LLM codegen workflow](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/). The development process involved using Cursor IDE with LLM-assisted code generation, following a structured approach of specification creation, blueprint planning, and iterative implementation. The complete development artifacts including the specification, blueprint, and implementation checklist are available in the `prompt-driven-development/` folder.

## Features

- **Deduplication**: Removes duplicate records based on ID and email fields
- **Date-Based Resolution**: Prefers records with the newest date, with last-in-list tie-breaker
- **Cross-Conflict Resolution**: Handles complex scenarios where records have both ID and email conflicts
- **Comprehensive Validation**: Validates required fields, date formats, and data integrity
- **Detailed Logging**: JSON log file with field-level change tracking and conflict resolution details
- **Performance Optimization**: Memory management and batch processing for large datasets
- **Flexible Input**: Support for multiple files, stdin, and various date formats
- **Multi-Key Processing**: Process JSON files with multiple record arrays using the `--key-names` option
- **Robust Error Handling**: Informative error messages with specific examples and counts

## Installation

### Prerequisites

- Node.js 16.0 or higher
- npm 8.0 or higher

## Quick Start

```bash
# Clone the repository
git clone https://github.com/tyreer/json-dedupe.git
cd json-dedupe

# Install dependencies
npm install

# Build the project
npm run build

# Run the tool
node dist/json-dedupe.js input.json
```

### Development

```bash
# Run tests
npm test

# Build the project
npm run build
```

## Usage

### Basic Usage

```bash
# Process a single file
node dist/json-dedupe.js input.json

# Process multiple files
node dist/json-dedupe.js file1.json file2.json file3.json

# Read from stdin
cat input.json | node dist/json-dedupe.js

# Specify output file
node dist/json-dedupe.js input.json -o output.json

# Specify log file
node dist/json-dedupe.js input.json --log-file changes.log
```

### Command Line Options

```bash
Usage: json-dedupe [options] [files...]

Options:
  -o, --output <file>           Output file path (default: auto-generated)
  -l, --log-file <file>         Log file path (default: auto-generated)
  -t, --timestamp-key <key>     Date field name (default: "entryDate")
  --key-names <keys>            Comma-separated list of keys to process (default: "leads")
  -v, --verbose                 Enable verbose output
  -q, --quiet                   Suppress all output except errors
  --dry-run                     Show what would be done without making changes
  --help                        Display help information
  --version                     Display version information
```

### Examples

#### Process with Custom Date Field

```bash
# Use "createdAt" instead of "entryDate" for date comparison
node dist/json-dedupe.js input.json --timestamp-key createdAt
```

#### Verbose Processing

```bash
# Show detailed processing information
node dist/json-dedupe.js input.json --verbose
```

#### Dry Run Mode

```bash
# See what would be processed without making changes
node dist/json-dedupe.js input.json --dry-run
```

#### Quiet Mode

```bash
# Suppress all output except errors
node dist/json-dedupe.js input.json --quiet
```

#### Process Multiple Keys

```bash
# Process specific keys in a JSON file
node dist/json-dedupe.js --key-names "leads,users" data.json

# Process single custom key
node dist/json-dedupe.js --key-names "customers" data.json

# Process multiple keys with custom timestamp field
node dist/json-dedupe.js --key-names "customers,prospects" --timestamp-key "createdAt" data.json
```

## Input Format

The tool expects JSON files with the following structure. By default, it looks for a `leads` key, but you can specify different keys using the `--key-names` option.

### Default Structure (leads key)

```json
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
```

### Multiple Keys Structure

```json
{
  "leads": [
    {
      "_id": "lead1",
      "email": "lead1@example.com",
      "entryDate": "2014-05-07T17:30:20+00:00",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "users": [
    {
      "_id": "user1",
      "email": "user1@example.com",
      "entryDate": "2014-05-07T17:31:20+00:00",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ],
  "customers": [
    {
      "_id": "customer1",
      "email": "customer1@example.com",
      "entryDate": "2014-05-07T17:32:20+00:00",
      "firstName": "Bob",
      "lastName": "Johnson"
    }
  ]
}
```

When processing multiple keys, all records from the specified keys are combined and deduplicated together. The output will contain all deduplicated records in a single `leads` array.

### Required Fields

- `_id`: Unique identifier for the record
- `email`: Email address (must be unique)
- `entryDate`: Date field for conflict resolution (configurable)

### Supported Date Formats

The tool automatically detects and parses various date formats:

- **ISO 8601**: `2014-05-07T17:30:20+00:00`
- **RFC 3339**: `2014-05-07T17:30:20Z`
- **Unix Timestamp**: `1399483820`
- **YYYY-MM-DD**: `2014-05-07`
- **MM/DD/YYYY**: `05/07/2014`
- **MM/DD/YYYY HH:MM:SS**: `05/07/2014 17:30:20`

## Output Format

### Deduplicated Data

The output file contains the deduplicated records in the same format as the input:

```json
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
```

### Change Log

The log file contains detailed information about all changes made during deduplication:

```json
{
  "summary": {
    "totalConflicts": 6,
    "idConflicts": 2,
    "emailConflicts": 4,
    "crossConflicts": 1,
    "totalChanges": 25,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "entries": [
    {
      "timestamp": "2024-01-15T10:30:00.307Z",
      "keptRecordId": "jkj238238jdsnfsj23",
      "droppedRecordId": "jkj238238jdsnfsj23",
      "conflictType": "id_conflict",
      "reason": "newer_date",
      "changes": {
        "keptEmail": "bill@bar.com",
        "droppedEmail": "coo@bar.com",
        "keptEntryDate": "2014-05-07T17:33:20+00:00",
        "droppedEntryDate": "2014-05-07T17:32:20+00:00",
        "keptFirstName": "John",
        "droppedFirstName": "Ted",
        "keptLastName": "Smith",
        "droppedLastName": "Jones",
        "keptAddress": "888 Mayberry St",
        "droppedAddress": "456 Neat St"
      },
      "metadata": {
        "keptRecordEmail": "bill@bar.com",
        "droppedRecordEmail": "coo@bar.com",
        "keptRecordDate": "2014-05-07T17:33:20+00:00",
        "droppedRecordDate": "2014-05-07T17:32:20+00:00"
      }
    }
  ]
}
```

## Deduplication Rules

### Conflict Detection

Records are considered duplicates if they share either:
- The same `_id` value
- The same `email` value

### Conflict Resolution

When conflicts are detected, the tool resolves them using these rules:

1. **Date Comparison**: Records with newer dates are preferred
2. **Tie-Breaker**: If dates are identical, the last record in the input is preferred
3. **Cross-Conflicts**: Records with both ID and email conflicts are resolved by preferring the newest date

### Field Merging

When merging records, the tool:
- Keeps all fields from the preferred record
- Logs all field differences for transparency
- Preserves the original data structure

## Error Handling

### Exit Codes

- `0`: Success
- `1`: Validation errors (missing fields, invalid dates, etc.)
- `2`: I/O errors (file not found, permission denied, etc.)
- `3`: General errors (processing errors, etc.)

### Error Messages

The tool provides detailed error messages including:
- Specific examples of problematic records
- Counts of affected records
- Clear descriptions of the issue
- Suggestions for resolution

### Example Error Output

```
Error: Validation failed
- 3 records missing required field '_id'
- 2 records have invalid date format in 'entryDate'
- Example invalid record: {"email": "test@example.com", "entryDate": "invalid-date"}

Exit code: 1
```

### Example Success Output with Cross-Conflicts

```
✅ Successfully processed 10 records, removed 5 duplicates (50.0% reduction), output 5 unique records
🔧 Resolved 3 conflicts with 6 field changes
⚠️  Including 1 cross-conflicts resolved by preferring newest dates
📄 Output written to: leads_deduplicated_2024-01-15T10-30-00.json
📋 Change log written to: leads_deduplicated_2024-01-15T10-30-00_changes.log.json
```

## Performance Features

### Memory Management

- **Automatic Monitoring**: Real-time memory usage tracking
- **Batch Processing**: Configurable batch sizes for large datasets
- **Garbage Collection**: Automatic memory cleanup
- **Memory Monitoring**: Real-time memory usage tracking (warnings disabled during tests for cleaner output)

### Optimization

- **Large Dataset Handling**: Automatic optimization for datasets > 10,000 records
- **Timeout Protection**: Configurable timeouts to prevent hanging operations
- **Progress Reporting**: Real-time progress tracking for long operations
- **Performance Metrics**: Detailed timing and memory statistics

### Performance Monitoring

The tool provides comprehensive performance metrics:

```bash
# Enable verbose mode to see performance information
node dist/json-dedupe.js large-file.json --verbose
```

Output includes:
- Processing duration
- Memory usage statistics
- Records processed per second
- Memory efficiency metrics

## API Reference

### Core Classes

#### `LeadRecord`

Represents a single lead record with validation and serialization.

```typescript
import { LeadRecord } from './dedupe/models';

const record = new LeadRecord({
  _id: 'unique-id',
  email: 'user@example.com',
  entryDate: '2014-05-07T17:30:20+00:00'
});
```

#### `DeduplicationEngine`

Core deduplication logic with conflict detection and resolution.

```typescript
import { DeduplicationEngine } from './dedupe/engine';

const engine = new DeduplicationEngine();
engine.addRecord(record);
const result = engine.deduplicate();
```

#### `ChangeLogger`

Tracks and logs all changes during deduplication.

```typescript
import { ChangeLogger } from './dedupe/logger';

const logger = new ChangeLogger();
logger.logMerge(keptRecord, droppedRecord, reason);
const log = logger.getLog();
```

### Performance Classes

#### `PerformanceMonitor`

Tracks performance metrics during processing.

```typescript
import { PerformanceMonitor } from './performance';

const monitor = new PerformanceMonitor();
monitor.start();
// ... processing ...
const metrics = monitor.stop(recordCount);
```

#### `MemoryManager`

Manages memory usage and batch processing.

```typescript
import { MemoryManager } from './performance';

const memoryCheck = MemoryManager.checkMemoryUsage();
const results = await MemoryManager.processInBatches(items, processor);
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for optimized performance
- `MAX_MEMORY_USAGE`: Maximum memory usage percentage (default: 80)
- `BATCH_SIZE`: Default batch size for processing (default: 10000)
- `TIMEOUT_MS`: Default timeout for operations (default: 300000)

### Performance Tuning

For large datasets, consider these optimizations:

```bash
# Increase Node.js memory limit
node --max-old-space-size=8192 dist/json-dedupe.js large-file.json

# Enable garbage collection
node --expose-gc dist/json-dedupe.js large-file.json

# Use quiet mode for better performance
node dist/json-dedupe.js large-file.json --quiet
```

## Troubleshooting

For common issues and solutions, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

Quick fixes:
- **Memory errors**: `node --max-old-space-size=8192 dist/json-dedupe.js input.json`
- **Date parsing**: `node dist/json-dedupe.js input.json --timestamp-key createdAt`
- **Validation errors**: `node dist/json-dedupe.js input.json --dry-run`

## Contributing

1. Fork the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Make your changes
5. Submit a pull request

### Testing

```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm run test:watch         # Watch mode
```

## Version History

### v0.1.0
- Initial release with core deduplication functionality
- Comprehensive validation, error handling, and performance optimization
- TypeScript implementation with full test coverage

## Support

- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
- Review error messages for specific guidance
- Enable verbose mode for detailed information

**Note**: This tool is designed for in-memory processing. For very large datasets that exceed available memory, consider preprocessing the data or using database-based deduplication tools.
