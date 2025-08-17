# JSON Deduplication Tool

A powerful command-line tool for deduplicating JSON records with comprehensive logging, validation, and performance optimization. Built with TypeScript and Node.js.

## Features

- **Smart Deduplication**: Removes duplicate records based on ID and email fields
- **Date-Based Resolution**: Prefers records with the newest date, with last-in-list tie-breaker
- **Comprehensive Validation**: Validates required fields, date formats, and data integrity
- **Detailed Logging**: JSON log file with field-level change tracking
- **Performance Optimization**: Memory management and batch processing for large datasets
- **Flexible Input**: Support for multiple files, stdin, and various date formats
- **Robust Error Handling**: Informative error messages with specific examples and counts

## Installation

### Prerequisites

- Node.js 16.0 or higher
- npm 8.0 or higher

### Install from Source

```bash
# Clone the repository
git clone <repository-url>
cd adobe-json

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Usage

### Basic Usage

```bash
# Process a single file
node dist/cli.js input.json

# Process multiple files
node dist/cli.js file1.json file2.json file3.json

# Read from stdin
cat input.json | node dist/cli.js

# Specify output file
node dist/cli.js input.json -o output.json

# Specify log file
node dist/cli.js input.json --log-file changes.log
```

### Command Line Options

```bash
Usage: json-dedupe [options] [files...]

Options:
  -o, --output <file>           Output file path (default: auto-generated)
  -l, --log-file <file>         Log file path (default: auto-generated)
  -t, --timestamp-key <key>     Date field name (default: "entryDate")
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
node dist/cli.js leads.json --timestamp-key createdAt
```

#### Verbose Processing

```bash
# Show detailed processing information
node dist/cli.js leads.json --verbose
```

#### Dry Run Mode

```bash
# See what would be processed without making changes
node dist/cli.js leads.json --dry-run
```

#### Quiet Mode

```bash
# Suppress all output except errors
node dist/cli.js leads.json --quiet
```

## Input Format

The tool expects JSON files with the following structure:

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
    "totalRecords": 10,
    "uniqueRecords": 8,
    "conflicts": 2,
    "changes": 4
  },
  "changes": [
    {
      "type": "merge",
      "keptRecord": {
        "_id": "id1",
        "email": "user1@example.com"
      },
      "droppedRecord": {
        "_id": "id2",
        "email": "user1@example.com"
      },
      "reason": "newer_date",
      "fieldChanges": {
        "keptFirstName": "John",
        "droppedFirstName": "Jane",
        "keptLastName": "Doe",
        "droppedLastName": "Smith"
      }
    }
  ],
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "0.1.0",
    "inputFiles": ["leads.json"],
    "outputFile": "leads_deduplicated_20240115_103000.json"
  }
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
3. **Cross-Conflicts**: If a record conflicts by both ID and email with different records, an error is raised

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
- `3`: General errors (cross-conflicts, processing errors, etc.)

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

## Performance Features

### Memory Management

- **Automatic Monitoring**: Real-time memory usage tracking
- **Batch Processing**: Configurable batch sizes for large datasets
- **Garbage Collection**: Automatic memory cleanup
- **Memory Warnings**: Alerts when memory usage exceeds 80%

### Optimization

- **Large Dataset Handling**: Automatic optimization for datasets > 10,000 records
- **Timeout Protection**: Configurable timeouts to prevent hanging operations
- **Progress Reporting**: Real-time progress tracking for long operations
- **Performance Metrics**: Detailed timing and memory statistics

### Performance Monitoring

The tool provides comprehensive performance metrics:

```bash
# Enable verbose mode to see performance information
node dist/cli.js large-file.json --verbose
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
node --max-old-space-size=8192 dist/cli.js large-file.json

# Enable garbage collection
node --expose-gc dist/cli.js large-file.json

# Use quiet mode for better performance
node dist/cli.js large-file.json --quiet
```

## Troubleshooting

### Common Issues

#### Memory Issues

If you encounter memory errors:

```bash
# Increase memory limit
node --max-old-space-size=8192 dist/cli.js large-file.json

# Use smaller batch sizes
export BATCH_SIZE=5000
node dist/cli.js large-file.json
```

#### Date Parsing Issues

If dates aren't being parsed correctly:

```bash
# Check the date format
node dist/cli.js input.json --verbose

# Use a different timestamp key
node dist/cli.js input.json --timestamp-key createdAt
```

#### Validation Errors

For validation issues:

```bash
# Use dry-run to see what would be processed
node dist/cli.js input.json --dry-run

# Check the error messages for specific examples
node dist/cli.js input.json
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
DEBUG=* node dist/cli.js input.json
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Make your changes
6. Add tests for new functionality
7. Run the full test suite: `npm run test:coverage`
8. Submit a pull request

### Code Style

- Use TypeScript with strict mode
- Follow ESLint configuration
- Write comprehensive tests
- Add JSDoc comments for public APIs
- Use conventional commit messages

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=test_models

# Run tests in watch mode
npm run test:watch
```

## License

[Add your license information here]

## Version History

### v0.1.0
- Initial release
- Core deduplication functionality
- Comprehensive validation and error handling
- Performance optimization features
- Detailed logging and change tracking
- Command-line interface with multiple options
- TypeScript implementation with full test coverage

## Support

For issues and questions:
- Check the troubleshooting section
- Review the error messages for specific guidance
- Enable verbose mode for detailed information
- Use dry-run mode to understand what the tool will do

---

**Note**: This tool is designed for in-memory processing. For very large datasets that exceed available memory, consider preprocessing the data or using database-based deduplication tools.
