# JSON Deduplication Tool - Implementation Blueprint

## Project Overview
Build a command-line JSON deduplication tool that processes lead records according to specific business rules, with comprehensive logging and error handling.

## Architecture Overview
- **Language**: TypeScript (for type safety and better development experience)
- **Structure**: Modular design with separate concerns
- **Testing**: Test-driven development with comprehensive unit tests
- **Dependencies**: Minimal external dependencies, focus on Node.js ecosystem

## Core Components
1. **CLI Interface** - Argument parsing and user interaction
2. **Data Models** - Record structure and validation
3. **Deduplication Engine** - Core business logic
4. **Logging System** - Change tracking and reporting
5. **File I/O** - Input/output handling
6. **Error Handling** - Validation and error reporting

---

# Phase 1: Foundation & Core Data Models

## Chunk 1.1: Project Setup and Basic Structure

### Step 1.1.1: Initialize Project Structure
- Create project directory structure
- Set up virtual environment
- Create basic `__init__.py` files
- Set up basic `requirements.txt` (minimal dependencies)

### Step 1.1.2: Create Data Model Classes
- Define `LeadRecord` class with required fields
- Implement basic validation for `_id` and `email`
- Add timestamp field handling with `entryDate` default
- Create unit tests for data model validation

### Step 1.1.3: Basic JSON Parsing
- Implement JSON file reading functionality
- Handle the `{"leads": [...]}` structure
- Add basic error handling for malformed JSON
- Create tests for JSON parsing scenarios

---

## Chunk 1.2: Timestamp Handling and Validation

### Step 1.2.1: Flexible Date Parsing
- Implement date parsing utility
- Support multiple common date formats
- Handle timezone information
- Add validation for invalid date formats

### Step 1.2.2: Record Validation System
- Implement comprehensive record validation
- Check for missing required fields (`_id`, `email`)
- Validate date formats
- Handle empty/null values
- Create detailed error reporting

---

# Phase 2: Core Deduplication Logic

## Chunk 2.1: Basic Deduplication Engine

### Step 2.1.1: Duplicate Detection
- Implement ID-based duplicate detection
- Implement email-based duplicate detection
- Create conflict resolution logic
- Handle simultaneous ID/email conflicts

### Step 2.1.2: Date-Based Resolution
- Implement newest date preference logic
- Handle identical dates (last in list preference)
- Create tie-breaking mechanisms
- Add comprehensive tests for edge cases

---

## Chunk 2.2: Conflict Resolution and Cross-Conflict Detection

### Step 2.2.1: Cross-Conflict Detection
- Detect records with both ID and email conflicts
- Implement resolution logic for cross-conflicts by preferring newest dates
- Create detailed logging for cross-conflict resolution scenarios

### Step 2.2.2: Record Merging Logic
- Implement field-by-field comparison
- Create kept/dropped field tracking
- Maintain data integrity during merging
- Preserve original field values

---

# Phase 3: Logging and Output Systems

## Chunk 3.1: Change Logging System

### Step 3.1.1: Log Structure Design
- Define JSON log format
- Implement change tracking for each field
- Create conflict type identification
- Add metadata for merge reasons

### Step 3.1.2: Log File Generation
- Implement separate log file creation
- Handle log file naming and location
- Add timestamp to log entries
- Create comprehensive log structure

---

## Chunk 3.2: Output File Handling

### Step 3.2.1: Output File Generation
- Implement default filename generation (input + timestamp)
- Handle custom output filenames
- Preserve original JSON structure
- Maintain record order

### Step 3.2.2: Progress and Summary Reporting
- Implement progress indicators
- Create summary statistics
- Add processing time tracking
- Display results to user

---

# Phase 4: CLI Interface and User Experience

## Chunk 4.1: Command Line Interface

### Step 4.1.1: Basic CLI Framework
- Implement argument parsing
- Add help and version flags
- Handle input file specification
- Support optional output file

### Step 4.1.2: Advanced CLI Options
- Add `--timestamp-key` option
- Implement `--verbose` and `--quiet` modes
- Add `--dry-run` functionality
- Support `--log-file` option

---

## Chunk 4.2: Input Flexibility

### Step 4.2.1: Multiple File Support
- Handle multiple input files
- Merge records from multiple sources
- Maintain proper ordering across files

### Step 4.2.2: Stdin Support
- Implement stdin reading capability
- Handle piping from other commands
- Maintain consistent processing logic

---

# Phase 5: Integration and Polish

## Chunk 5.1: Error Handling Integration

### Step 5.1.1: Comprehensive Error System
- Integrate all error handling components
- Implement proper exit codes
- Create user-friendly error messages
- Add error recovery mechanisms

### Step 5.1.2: Edge Case Handling
- Handle large file scenarios
- Implement memory management
- Add timeout handling
- Create robust error recovery

---

## Chunk 5.2: Final Integration and Testing

### Step 5.2.1: End-to-End Integration
- Wire all components together
- Ensure proper data flow
- Validate complete functionality
- Create integration tests

### Step 5.2.2: Performance and Polish
- Optimize performance
- Add comprehensive documentation
- Create usage examples
- Final testing and validation

---

# Implementation Prompts

## Prompt 1: Project Setup and Basic Data Models

```text
Create a Python project for a JSON deduplication tool with the following requirements:

1. Create a project structure with the following directories:
   - src/dedupe/
   - tests/
   - docs/

2. Create a virtual environment and requirements.txt with minimal dependencies (just what's needed for JSON processing and CLI)

3. Create a LeadRecord class in src/dedupe/models.py with:
   - Required fields: _id, email, entryDate
   - Optional fields: firstName, lastName, address
   - Validation methods for required fields
   - Date parsing capability for entryDate field

4. Create comprehensive unit tests in tests/test_models.py that cover:
   - Valid record creation
   - Missing required field validation
   - Invalid date format handling
   - Empty/null value validation

5. Create a basic JSON parser in src/dedupe/parser.py that:
   - Reads JSON files with {"leads": [...]} structure
   - Converts JSON to LeadRecord objects
   - Handles basic JSON parsing errors

Use test-driven development - write tests first, then implement the functionality. Focus on clean, maintainable code with proper error handling.
```

## Prompt 2: Enhanced Validation and Date Handling

```text
Extend the JSON deduplication tool with enhanced validation and flexible date handling:

1. Enhance the date parsing in src/dedupe/utils.py to support multiple formats:
   - ISO 8601 (2014-05-07T17:30:20+00:00)
   - RFC 3339
   - Unix timestamps
   - Common date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
   - Handle timezone information properly

2. Create a comprehensive validation system in src/dedupe/validator.py:
   - Validate all required fields (_id, email) are present and non-empty
   - Validate date formats can be parsed
   - Collect all validation errors before reporting
   - Provide detailed error messages with example records

3. Add a configuration system in src/dedupe/config.py:
   - Allow custom timestamp field names (default: "entryDate")
   - Support for different date formats
   - Validation rule configuration

4. Update tests to cover:
   - Multiple date format parsing
   - Comprehensive validation scenarios
   - Configuration options
   - Error message accuracy

5. Create a sample data generator in tests/fixtures.py for testing with various edge cases

Focus on robust error handling and comprehensive test coverage. Each validation error should include the specific record that caused the issue and a count of similar errors.
```

## Prompt 3: Core Deduplication Engine

```text
Implement the core deduplication engine for the JSON tool:

1. Create src/dedupe/engine.py with a DeduplicationEngine class that:
   - Detects duplicates based on _id and email fields
   - Handles simultaneous ID and email conflict detection
   - Implements date-based resolution (newest date preferred)
   - Handles tie-breaking (last record in list when dates are identical)

2. Implement conflict detection logic:
   - Build indexes for _id and email lookups
   - Detect cross-conflicts (same record has both ID and email conflicts with different records)
   - Resolve cross-conflicts by preferring newest dates (not exit with error)

3. Create record comparison and merging:
   - Compare records field by field
   - Track which fields are kept vs dropped
   - Preserve original field values without modification
   - Maintain data integrity during merging

4. Add comprehensive tests in tests/test_engine.py:
   - Test duplicate detection scenarios
   - Test date-based resolution
   - Test cross-conflict detection and resolution
   - Test edge cases with identical dates
   - Test field comparison and merging

5. Create a conflict resolution strategy that:
   - Prioritizes newest date for all conflicts (including cross-conflicts)
   - Handles identical dates by preferring last record
   - Maintains idempotence (running twice produces same result)
   - Preserves all original data without mutation

Focus on the business logic correctness and comprehensive test coverage. The engine should be stateless and produce deterministic results.
```

## Prompt 4: Logging and Change Tracking

```text
Implement the logging and change tracking system for the deduplication tool:

1. Create src/dedupe/logger.py with a ChangeLogger class that:
   - Tracks all field changes during deduplication
   - Records conflict types (id_conflict, email_conflict)
   - Logs which records were merged and why
   - Uses the format: kept<Field> and dropped<Field> for field changes

2. Implement JSON log structure:
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
           "droppedEmail": "old@example.com"
         }
       }
     ]
   }
   ```

3. Create log file management:
   - Generate separate log files (not included in output)
   - Handle log file naming and location
   - Add timestamps to log entries
   - Ensure atomic log file writing

4. Add comprehensive tests in tests/test_logger.py:
   - Test change tracking accuracy
   - Test log file generation
   - Test conflict type identification
   - Test field change recording

5. Integrate logging with the deduplication engine:
   - Hook logging into the engine's merge operations
   - Track all decision points during deduplication
   - Ensure complete audit trail of changes

Focus on creating a complete audit trail that accurately reflects all decisions made during deduplication. The log should be human-readable and machine-parseable.
```

## Prompt 5: Output File Handling and Progress Reporting

```text
Implement output file handling and user feedback systems:

1. Create src/dedupe/output.py with an OutputManager class that:
   - Generates default output filenames (input + timestamp)
   - Handles custom output filename specification
   - Preserves original JSON structure {"leads": [...]}
   - Maintains original record order from input

2. Implement progress reporting:
   - Show processing status during file reading
   - Display deduplication progress
   - Indicate log file creation
   - Provide real-time feedback to user

3. Create summary reporting:
   - Total records processed
   - Total unique records output
   - Number of duplicates found
   - Processing time
   - Example: "Processed 10 records, output 7 unique records in 0.5 seconds"

4. Add file I/O error handling:
   - Handle input file not found
   - Handle output directory not writable
   - Handle insufficient permissions
   - Provide clear error messages with exit codes

5. Create tests in tests/test_output.py:
   - Test filename generation
   - Test output file creation
   - Test progress reporting
   - Test error handling scenarios

6. Add support for multiple input files:
   - Merge records from multiple sources
   - Maintain proper ordering across files
   - Handle file-specific errors

Focus on user experience and robust error handling. The output should be predictable and the progress reporting should give users confidence that the tool is working correctly.
```

## Prompt 6: Command Line Interface

```text
Implement the complete command line interface for the deduplication tool:

1. Create src/dedupe/cli.py with argument parsing:
   - Basic usage: `dedupe <input-file> [output-file]`
   - Support for stdin: `cat file.json | dedupe`
   - Multiple files: `dedupe file1.json file2.json output.json`

2. Implement all required command line options:
   - `--timestamp-key <key>`: Custom timestamp field (default: "entryDate")
   - `--verbose`: Enable verbose logging
   - `--quiet`: Suppress progress messages
   - `--dry-run`: Show what would be deduplicated without writing files
   - `--log-file <file>`: Custom log file name/location
   - `--help`: Show help information
   - `--version`: Show version information

3. Create main entry point in src/dedupe/__main__.py:
   - Parse command line arguments
   - Initialize configuration
   - Orchestrate the deduplication process
   - Handle all error conditions with proper exit codes

4. Implement exit codes:
   - 0: Success
   - 1: Validation errors (missing fields, invalid dates)
   - 2: File I/O errors
   - 3: General errors (JSON parsing, memory, etc.)

5. Add comprehensive tests in tests/test_cli.py:
   - Test all command line options
   - Test error handling and exit codes
   - Test stdin/stdout handling
   - Test multiple file processing

6. Create setup.py for package installation:
   - Define entry point for `dedupe` command
   - Include all dependencies
   - Add package metadata

Focus on creating a professional, user-friendly CLI that follows standard conventions. The interface should be intuitive and provide clear feedback for all operations.
```

## Prompt 7: Integration and End-to-End Testing

```text
Integrate all components and create comprehensive end-to-end testing:

1. Wire all components together in src/dedupe/__main__.py:
   - Connect CLI parsing to configuration
   - Link file I/O to validation
   - Connect deduplication engine to logging
   - Integrate output handling with progress reporting

2. Create integration tests in tests/test_integration.py:
   - Test complete workflow with sample data
   - Test error scenarios end-to-end
   - Test multiple file processing
   - Test stdin/stdout scenarios
   - Test all command line options

3. Add performance optimizations:
   - Optimize memory usage for large datasets
   - Improve processing speed
   - Add timeout handling for long operations
   - Implement efficient data structures

4. Create comprehensive documentation:
   - README.md with usage examples
   - API documentation
   - Command line help text
   - Troubleshooting guide

5. Add final polish:
   - Error message improvements
   - Progress indicator refinements
   - Log format optimizations
   - Code style and documentation cleanup

6. Create acceptance tests using the provided leads.json:
   - Verify correct deduplication results
   - Validate log output format
   - Test error handling with invalid data
   - Ensure all business rules are followed

Focus on creating a robust, production-ready tool that handles all edge cases gracefully. The integration should be seamless and the testing should be comprehensive enough to catch any issues.

Test the complete workflow with the provided leads.json file to ensure it produces the expected results according to the business rules.
```

## Prompt 8: Final Testing and Documentation

```text
Complete the final testing, documentation, and deployment preparation:

1. Create comprehensive test suite:
   - Unit tests for all components (100% coverage target)
   - Integration tests for complete workflows
   - Performance tests for large datasets
   - Edge case testing with malformed data

2. Create user documentation:
   - Installation instructions
   - Usage examples with real scenarios
   - Troubleshooting guide
   - FAQ section

3. Add developer documentation:
   - API reference
   - Architecture overview
   - Contributing guidelines
   - Code style guide

4. Create deployment package:
   - setup.py with all dependencies
   - requirements.txt for development
   - Dockerfile for containerized deployment
   - GitHub Actions for CI/CD

5. Final validation:
   - Test with the provided leads.json file
   - Verify all business rules are implemented correctly
   - Ensure error handling works as specified
   - Validate log output format

6. Performance and security review:
   - Memory usage optimization
   - Input validation security
   - Error message security (no sensitive data leakage)
   - Code quality and maintainability

Focus on creating a production-ready tool that can be confidently deployed and used. The documentation should be comprehensive enough for both users and developers, and the testing should ensure reliability in all scenarios.

Create a final demonstration using the leads.json file to show the complete functionality working as specified.
```

---

# Implementation Notes

## Refactoring Note
**Important**: During implementation, the approach to cross-conflicts was refactored to better align with the original assignment requirements. The initial specification suggested treating cross-conflicts as fatal errors, but the assignment clearly states "The data from the newest date should be preferred." Therefore, the final implementation resolves cross-conflicts by preferring the newest date rather than exiting with an error. This ensures the tool performs complete deduplication while maintaining data integrity and providing comprehensive logging of all resolved conflicts.

## Testing Strategy
- **Unit Tests**: Test each component in isolation
- **Integration Tests**: Test component interactions
- **Acceptance Tests**: Test complete workflows
- **Performance Tests**: Test with large datasets
- **Edge Case Tests**: Test error conditions and boundary cases

## Code Quality Standards
- **Test Coverage**: Aim for 100% coverage
- **Error Handling**: Comprehensive error handling with proper exit codes
- **Documentation**: Clear docstrings and comments
- **Code Style**: Follow PEP 8 standards
- **Type Hints**: Use type hints for better code clarity

## Dependencies
- **Minimal External Dependencies**: Use Node.js built-ins where possible
- **JSON Processing**: Use built-in JSON module
- **Date Parsing**: Use date-fns for flexible parsing
- **CLI**: Use commander for command line interface
- **Testing**: Use Jest for testing framework

## Success Criteria
- All business rules implemented correctly
- Comprehensive error handling and validation
- Detailed logging of all changes
- User-friendly command line interface
- Robust testing with high coverage
- Clear documentation for users and developers
