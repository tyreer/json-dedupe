# JSON Deduplication Tool - Implementation Checklist

## Phase 1: Foundation & Core Data Models

### Chunk 1.1: Project Setup and Basic Structure

#### Step 1.1.1: Initialize Project Structure
- [x] Create project directory structure
  - [x] `src/dedupe/` directory
  - [x] `tests/` directory
  - [x] `docs/` directory
- [x] Set up TypeScript project
  - [x] Create `package.json` with TypeScript dependencies
  - [x] Create `tsconfig.json` configuration
  - [x] Create `jest.config.js` for TypeScript testing
  - [x] Add TypeScript and testing dependencies

#### Step 1.1.2: Create Data Model Classes
- [x] Create `src/dedupe/models.ts`
  - [x] Define `LeadRecord` class with TypeScript interfaces
  - [x] Add required fields: `_id`, `email`, `entryDate`
  - [x] Add optional fields: `firstName`, `lastName`, `address`
  - [x] Implement constructor with proper typing
  - [x] Implement `toString` method
  - [x] Add validation methods for required fields
  - [x] Add date parsing capability for `entryDate` field
  - [x] Add comprehensive TypeScript types and interfaces
- [x] Create `tests/test_models.ts`
  - [x] Test valid record creation
  - [x] Test missing required field validation
  - [x] Test invalid date format handling
  - [x] Test empty/null value validation
  - [x] Test date parsing functionality
  - [x] Test field access and modification

#### Step 1.1.3: Basic JSON Parsing
- [x] Create `src/dedupe/parser.ts`
  - [x] Implement JSON file reading functionality
  - [x] Handle `{"leads": [...]}` structure
  - [x] Convert JSON to `LeadRecord` objects
  - [x] Add basic error handling for malformed JSON
  - [x] Add file not found error handling
  - [x] Add JSON syntax error handling
  - [x] Add comprehensive TypeScript error handling
- [x] Create `tests/test_parser.ts`
  - [x] Test valid JSON file parsing
  - [x] Test malformed JSON error handling
  - [x] Test file not found error handling
  - [x] Test empty file handling
  - [x] Test invalid structure handling

### Chunk 1.2: Timestamp Handling and Validation

#### Step 1.2.1: Flexible Date Parsing
- [x] Create `src/dedupe/utils.ts`
  - [x] Implement date parsing utility function
  - [x] Support ISO 8601 format (2014-05-07T17:30:20+00:00)
  - [x] Support RFC 3339 format
  - [x] Support Unix timestamps
  - [x] Support common date formats (YYYY-MM-DD, MM/DD/YYYY)
  - [x] Handle timezone information properly
  - [x] Add validation for invalid date formats
  - [x] Add fallback parsing strategies
- [x] Create `tests/test_utils.ts`
  - [x] Test all supported date formats
  - [x] Test timezone handling
  - [x] Test invalid date format error handling
  - [x] Test edge cases (leap years, DST, etc.)

#### Step 1.2.2: Record Validation System
- [x] Create `src/dedupe/validator.ts`
  - [x] Implement comprehensive record validation
  - [x] Check for missing required fields (`_id`, `email`)
  - [x] Validate date formats can be parsed
  - [x] Handle empty/null values for critical fields
  - [x] Collect all validation errors before reporting
  - [x] Provide detailed error messages with example records
  - [x] Add error categorization (missing fields, invalid dates, etc.)
- [x] Create `tests/test_validator.ts`
  - [x] Test missing required field validation
  - [x] Test invalid date format validation
  - [x] Test empty/null value validation
  - [x] Test multiple error collection
  - [x] Test error message accuracy
  - [x] Test error categorization

## Phase 2: Core Deduplication Logic

### Chunk 2.1: Basic Deduplication Engine

#### Step 2.1.1: Duplicate Detection
- [ ] Create `src/dedupe/engine.py`
  - [ ] Implement `DeduplicationEngine` class
  - [ ] Add ID-based duplicate detection
  - [ ] Add email-based duplicate detection
  - [ ] Create conflict resolution logic
  - [ ] Handle simultaneous ID/email conflicts
  - [ ] Build indexes for efficient lookups
  - [ ] Add conflict type identification
- [ ] Create `tests/test_engine.py`
  - [ ] Test ID-based duplicate detection
  - [ ] Test email-based duplicate detection
  - [ ] Test simultaneous conflict detection
  - [ ] Test index building efficiency
  - [ ] Test conflict type identification

#### Step 2.1.2: Date-Based Resolution
- [ ] Extend `DeduplicationEngine` class
  - [ ] Implement newest date preference logic
  - [ ] Handle identical dates (last in list preference)
  - [ ] Create tie-breaking mechanisms
  - [ ] Add date comparison utilities
  - [ ] Implement record comparison logic
- [ ] Add comprehensive tests
  - [ ] Test date-based resolution scenarios
  - [ ] Test identical date tie-breaking
  - [ ] Test edge cases with identical dates
  - [ ] Test record comparison accuracy

### Chunk 2.2: Conflict Resolution and Cross-Conflict Detection

#### Step 2.2.1: Cross-Conflict Detection
- [ ] Extend `DeduplicationEngine` class
  - [ ] Detect records with both ID and email conflicts
  - [ ] Implement error handling for cross-conflicts
  - [ ] Create detailed error reporting for cross-conflicts
  - [ ] Add cross-conflict validation logic
  - [ ] Implement early exit for cross-conflicts
- [ ] Add comprehensive tests
  - [ ] Test cross-conflict detection
  - [ ] Test cross-conflict error handling
  - [ ] Test error message accuracy for cross-conflicts
  - [ ] Test early exit behavior

#### Step 2.2.2: Record Merging Logic
- [ ] Implement record merging functionality
  - [ ] Compare records field by field
  - [ ] Create kept/dropped field tracking
  - [ ] Maintain data integrity during merging
  - [ ] Preserve original field values without modification
  - [ ] Implement field comparison utilities
  - [ ] Add merge result tracking
- [ ] Add comprehensive tests
  - [ ] Test field-by-field comparison
  - [ ] Test kept/dropped field tracking
  - [ ] Test data integrity preservation
  - [ ] Test merge result accuracy

## Phase 3: Logging and Output Systems

### Chunk 3.1: Change Logging System

#### Step 3.1.1: Log Structure Design
- [ ] Create `src/dedupe/logger.py`
  - [ ] Implement `ChangeLogger` class
  - [ ] Define JSON log format structure
  - [ ] Track all field changes during deduplication
  - [ ] Record conflict types (id_conflict, email_conflict)
  - [ ] Log which records were merged and why
  - [ ] Use `kept<Field>` and `dropped<Field>` format for field changes
  - [ ] Add metadata for merge reasons
- [ ] Create `tests/test_logger.py`
  - [ ] Test log structure creation
  - [ ] Test field change tracking
  - [ ] Test conflict type recording
  - [ ] Test merge reason logging
  - [ ] Test field naming format

#### Step 3.1.2: Log File Generation
- [ ] Implement log file management
  - [ ] Generate separate log files (not included in output)
  - [ ] Handle log file naming and location
  - [ ] Add timestamps to log entries
  - [ ] Ensure atomic log file writing
  - [ ] Add log file rotation if needed
  - [ ] Implement log file cleanup
- [ ] Add comprehensive tests
  - [ ] Test log file generation
  - [ ] Test log file naming
  - [ ] Test atomic writing
  - [ ] Test timestamp accuracy

### Chunk 3.2: Output File Handling

#### Step 3.2.1: Output File Generation
- [ ] Create `src/dedupe/output.py`
  - [ ] Implement `OutputManager` class
  - [ ] Generate default output filenames (input + timestamp)
  - [ ] Handle custom output filename specification
  - [ ] Preserve original JSON structure `{"leads": [...]}`
  - [ ] Maintain original record order from input
  - [ ] Add output file validation
  - [ ] Implement atomic file writing
- [ ] Create `tests/test_output.py`
  - [ ] Test default filename generation
  - [ ] Test custom filename handling
  - [ ] Test JSON structure preservation
  - [ ] Test record order preservation
  - [ ] Test atomic file writing

#### Step 3.2.2: Progress and Summary Reporting
- [ ] Implement progress reporting
  - [ ] Show processing status during file reading
  - [ ] Display deduplication progress
  - [ ] Indicate log file creation
  - [ ] Provide real-time feedback to user
  - [ ] Add progress bar or status indicators
- [ ] Create summary reporting
  - [ ] Total records processed
  - [ ] Total unique records output
  - [ ] Number of duplicates found
  - [ ] Processing time
  - [ ] Example: "Processed 10 records, output 7 unique records in 0.5 seconds"
- [ ] Add comprehensive tests
  - [ ] Test progress reporting accuracy
  - [ ] Test summary statistics
  - [ ] Test processing time calculation

## Phase 4: CLI Interface and User Experience

### Chunk 4.1: Command Line Interface

#### Step 4.1.1: Basic CLI Framework
- [ ] Create `src/dedupe/cli.py`
  - [ ] Implement argument parsing
  - [ ] Add help and version flags
  - [ ] Handle input file specification
  - [ ] Support optional output file
  - [ ] Add basic error handling for CLI arguments
  - [ ] Implement argument validation
- [ ] Create `tests/test_cli.py`
  - [ ] Test basic argument parsing
  - [ ] Test help and version flags
  - [ ] Test input file handling
  - [ ] Test output file handling
  - [ ] Test argument validation

#### Step 4.1.2: Advanced CLI Options
- [ ] Implement all required command line options
  - [ ] `--timestamp-key <key>`: Custom timestamp field (default: "entryDate")
  - [ ] `--verbose`: Enable verbose logging
  - [ ] `--quiet`: Suppress progress messages
  - [ ] `--dry-run`: Show what would be deduplicated without writing files
  - [ ] `--log-file <file>`: Custom log file name/location
  - [ ] `--help`: Show help information
  - [ ] `--version`: Show version information
- [ ] Add comprehensive tests
  - [ ] Test all command line options
  - [ ] Test option combinations
  - [ ] Test option validation
  - [ ] Test help text accuracy

### Chunk 4.2: Input Flexibility

#### Step 4.2.1: Multiple File Support
- [ ] Implement multiple file handling
  - [ ] Handle multiple input files
  - [ ] Merge records from multiple sources
  - [ ] Maintain proper ordering across files
  - [ ] Handle file-specific errors
  - [ ] Add file validation for multiple inputs
- [ ] Add comprehensive tests
  - [ ] Test multiple file processing
  - [ ] Test record ordering across files
  - [ ] Test file-specific error handling
  - [ ] Test file validation

#### Step 4.2.2: Stdin Support
- [ ] Implement stdin reading capability
  - [ ] Handle stdin input
  - [ ] Handle piping from other commands
  - [ ] Maintain consistent processing logic
  - [ ] Add stdin validation
  - [ ] Handle stdin error conditions
- [ ] Add comprehensive tests
  - [ ] Test stdin reading
  - [ ] Test piping scenarios
  - [ ] Test stdin error handling
  - [ ] Test stdin validation

## Phase 5: Integration and Polish

### Chunk 5.1: Error Handling Integration

#### Step 5.1.1: Comprehensive Error System
- [ ] Integrate all error handling components
  - [ ] Connect validation errors to CLI
  - [ ] Connect file I/O errors to CLI
  - [ ] Connect deduplication errors to CLI
  - [ ] Implement proper exit codes
  - [ ] Create user-friendly error messages
  - [ ] Add error recovery mechanisms
- [ ] Implement exit codes
  - [ ] 0: Success
  - [ ] 1: Validation errors (missing fields, invalid dates, cross-conflicts)
  - [ ] 2: File I/O errors
  - [ ] 3: General errors (JSON parsing, memory, etc.)
- [ ] Add comprehensive tests
  - [ ] Test all exit codes
  - [ ] Test error message accuracy
  - [ ] Test error recovery
  - [ ] Test error categorization

#### Step 5.1.2: Edge Case Handling
- [ ] Implement edge case handling
  - [ ] Handle large file scenarios
  - [ ] Implement memory management
  - [ ] Add timeout handling for long operations
  - [ ] Create robust error recovery
  - [ ] Add performance monitoring
  - [ ] Implement graceful degradation
- [ ] Add comprehensive tests
  - [ ] Test large file handling
  - [ ] Test memory management
  - [ ] Test timeout scenarios
  - [ ] Test error recovery

### Chunk 5.2: Final Integration and Testing

#### Step 5.2.1: End-to-End Integration
- [ ] Wire all components together
  - [ ] Connect CLI parsing to configuration
  - [ ] Link file I/O to validation
  - [ ] Connect deduplication engine to logging
  - [ ] Integrate output handling with progress reporting
  - [ ] Ensure proper data flow
  - [ ] Validate complete functionality
- [ ] Create `src/dedupe/__main__.py`
  - [ ] Parse command line arguments
  - [ ] Initialize configuration
  - [ ] Orchestrate the deduplication process
  - [ ] Handle all error conditions with proper exit codes
- [ ] Create integration tests
  - [ ] Test complete workflow with sample data
  - [ ] Test error scenarios end-to-end
  - [ ] Test multiple file processing
  - [ ] Test stdin/stdout scenarios
  - [ ] Test all command line options

#### Step 5.2.2: Performance and Polish
- [ ] Add performance optimizations
  - [ ] Optimize memory usage for large datasets
  - [ ] Improve processing speed
  - [ ] Add timeout handling for long operations
  - [ ] Implement efficient data structures
- [ ] Create comprehensive documentation
  - [ ] README.md with usage examples
  - [ ] API documentation
  - [ ] Command line help text
  - [ ] Troubleshooting guide
- [ ] Add final polish
  - [ ] Error message improvements
  - [ ] Progress indicator refinements
  - [ ] Log format optimizations
  - [ ] Code style and documentation cleanup

## Final Testing and Validation

### Comprehensive Test Suite
- [ ] Unit tests for all components (100% coverage target)
  - [ ] Test all public methods
  - [ ] Test all error conditions
  - [ ] Test edge cases
  - [ ] Test boundary conditions
- [ ] Integration tests for complete workflows
  - [ ] Test end-to-end scenarios
  - [ ] Test component interactions
  - [ ] Test data flow integrity
- [ ] Performance tests for large datasets
  - [ ] Test memory usage
  - [ ] Test processing speed
  - [ ] Test scalability
- [ ] Edge case testing with malformed data
  - [ ] Test invalid JSON
  - [ ] Test missing fields
  - [ ] Test invalid dates
  - [ ] Test cross-conflicts

### Documentation
- [ ] User documentation
  - [ ] Installation instructions
  - [ ] Usage examples with real scenarios
  - [ ] Troubleshooting guide
  - [ ] FAQ section
- [ ] Developer documentation
  - [ ] API reference
  - [ ] Architecture overview
  - [ ] Contributing guidelines
  - [ ] Code style guide

### Deployment Package
- [ ] Create `setup.py`
  - [ ] Define entry point for `dedupe` command
  - [ ] Include all dependencies
  - [ ] Add package metadata
  - [ ] Add version information
- [ ] Create `requirements.txt` for development
- [ ] Create `Dockerfile` for containerized deployment
- [ ] Create GitHub Actions for CI/CD
  - [ ] Automated testing
  - [ ] Code quality checks
  - [ ] Documentation generation
  - [ ] Release automation

### Final Validation
- [ ] Test with the provided `leads.json` file
  - [ ] Verify correct deduplication results
  - [ ] Validate log output format
  - [ ] Test error handling with invalid data
  - [ ] Ensure all business rules are followed
- [ ] Performance and security review
  - [ ] Memory usage optimization
  - [ ] Input validation security
  - [ ] Error message security (no sensitive data leakage)
  - [ ] Code quality and maintainability

## Acceptance Criteria

### Functional Requirements
- [ ] Successfully deduplicates JSON records according to specified rules
- [ ] Provides comprehensive logging of all changes
- [ ] Handles errors gracefully with informative messages
- [ ] Maintains data integrity and prevents data loss
- [ ] Provides clear user feedback and progress indicators

### Technical Requirements
- [ ] All business rules implemented correctly
- [ ] Comprehensive error handling and validation
- [ ] Detailed logging of all changes
- [ ] User-friendly command line interface
- [ ] Robust testing with high coverage
- [ ] Clear documentation for users and developers

### Quality Standards
- [ ] 100% test coverage for all components
- [ ] All code follows PEP 8 standards
- [ ] Comprehensive error handling with proper exit codes
- [ ] Clear docstrings and comments throughout
- [ ] Type hints used for better code clarity
- [ ] No sensitive data leakage in error messages

## Notes
- Use test-driven development throughout
- Focus on clean, maintainable code
- Ensure proper error handling at every step
- Maintain backward compatibility where possible
- Document all public APIs and interfaces
- Test with real data from `leads.json` throughout development
- **TypeScript**: All code is written in TypeScript with strict type checking
- **Testing**: Jest with ts-jest for TypeScript testing
