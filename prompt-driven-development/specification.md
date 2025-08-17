# JSON Deduplication Tool Specification

## Overview
A command-line tool that takes variable numbers of identically structured JSON records and de-duplicates them according to specific business rules.

## Input/Output Interface

### Input
- **Primary**: Single JSON file (default behavior)
- **Multiple files**: Support for processing multiple input files
- **Stdin**: Support for reading from stdin (piping from other commands)
- **Format**: JSON with structure `{"leads": [...]}` (as per leads.json sample)

### Output
- **Default**: Input filename + timestamp (e.g., `leads_20241201_143022.json`)
- **Custom**: Optional output filename parameter
- **Structure**: Maintains exact same `{"leads": [...]}` structure
- **Order**: Preserves original record order from input
- **Fields**: Preserves all original fields exactly as they were

### Command Line Interface
```
dedupe [options] <input-file> [output-file]
```

**Options:**
- `--timestamp-key <key>`: Specify custom timestamp field (default: "entryDate")
- `--verbose`: Enable verbose logging
- `--quiet`: Suppress progress messages
- `--dry-run`: Show what would be deduplicated without writing files
- `--log-file <file>`: Specify custom log file name/location
- `--help`: Show help information
- `--version`: Show version information

## Deduplication Rules

### Primary Rules
1. **Date Preference**: Data from the newest date should be preferred
2. **Duplicate Criteria**: 
   - Duplicate IDs count as duplicates
   - Duplicate emails count as duplicates
   - Both must be unique in the dataset
   - Duplicate values elsewhere do not count as duplicates
3. **Tie Breaking**: If dates are identical, data from the record provided last in the list should be preferred

### Conflict Resolution
- **Simultaneous Processing**: Handle ID and email conflicts simultaneously
- **Cross-Conflicts**: Records with both ID conflict AND email conflict with different records are resolved by preferring newest dates
- **Data Preservation**: Must not erase potentially valuable data or fabricate _id values
- **Date-Based Resolution**: All conflicts (including cross-conflicts) are resolved by preferring the record with the newest date

### Timestamp Handling
- **Default Field**: `entryDate`
- **Flexible Parsing**: Include time parsing utility capable of detecting common time formats
- **Configurable**: Allow `--timestamp-key` flag for different data formats

## Error Handling

### Validation Errors (Exit Code: 1)
- **Missing Required Fields**: Exit if records missing `_id` or `email` fields
- **Invalid Date Formats**: Exit if records have unparseable date formats
- **Empty/Null Values**: Exit if critical fields (`_id`, `email`) have empty/null values

### Error Message Format
For all validation errors, provide:
- Informative error message
- Single violating example from actual dataset
- Count of records with the specific issue
- Continue processing only to gather error information, do not complete partial deduplication

### File I/O Errors (Exit Code: 2)
- Input file not found or unreadable
- Output directory not writable
- Insufficient permissions

### General Errors (Exit Code: 3)
- JSON parsing errors
- Memory allocation failures
- Other unexpected errors

## Logging

### Log File
- **Separate File**: Dedicated log file (not included in output)
- **Format**: JSON
- **Content**: Only fields that actually changed
- **Field Naming**: Use `kept<Field>` and `dropped<Field>` format
- **Metadata**: Include which records were merged and why (ID conflict vs email conflict)

### Log Structure Example
```json
{
  "deduplication_log": [
    {
      "conflict_type": "id_conflict",
      "conflicting_records": ["record1_id", "record2_id"],
      "chosen_record": "record2_id",
      "reason": "newer_date",
      "field_changes": {
        "keptEmail": "new@example.com",
        "droppedEmail": "old@example.com",
        "keptFirstName": "John",
        "droppedFirstName": "Jane"
      }
    }
  ]
}
```

## User Feedback

### Progress Indicators
- Show processing status during file reading
- Display deduplication progress
- Indicate log file creation

### Summary Output
- Total records processed
- Total unique records output
- Number of duplicates found
- Processing time
- Example: "Processed 10 records, output 7 unique records in 0.5 seconds"

## Technical Requirements

### Performance
- **Memory**: Everything processed in memory (no large file concerns)
- **Idempotence**: Tool should have good idempotence profile
- **Non-mutation**: Should not mutate original data

### Dependencies
- JSON parsing library
- Date/time parsing utility
- Command-line argument parsing
- File I/O handling

### Platform Support
- Command-line interface
- Cross-platform compatibility
- Standard input/output support

## Example Usage

```bash
# Basic usage
dedupe leads.json

# Custom output and timestamp field
dedupe --timestamp-key "created_at" leads.json output.json

# Multiple files
dedupe file1.json file2.json combined_output.json

# From stdin
cat leads.json | dedupe

# Dry run
dedupe --dry-run leads.json

# Verbose with custom log
dedupe --verbose --log-file changes.log leads.json
```

## Success Criteria
- Successfully deduplicates JSON records according to specified rules
- Provides comprehensive logging of all changes
- Handles errors gracefully with informative messages
- Maintains data integrity and prevents data loss
- Provides clear user feedback and progress indicators
- Resolves all conflicts (including cross-conflicts) by preferring newest dates
- Logs detailed information about all conflicts that were resolved
