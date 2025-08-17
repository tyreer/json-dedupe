# Troubleshooting Guide

This guide helps you resolve common issues when using the JSON Deduplication Tool.

## Table of Contents

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Memory Issues](#memory-issues)
- [Validation Issues](#validation-issues)
- [File I/O Issues](#file-io-issues)
- [Debug Mode](#debug-mode)
- [Getting Help](#getting-help)

## Common Issues

### Tool Not Found

**Problem**: `command not found: json-dedupe`

**Solutions**:
1. **Install globally**:
   ```bash
   npm install -g .
   ```

2. **Use local installation**:
   ```bash
   node dist/cli.js input.json
   ```

3. **Check PATH**:
   ```bash
   which json-dedupe
   echo $PATH
   ```

### Permission Denied

**Problem**: `EACCES: permission denied`

**Solutions**:
1. **Check file permissions**:
   ```bash
   ls -la input.json
   chmod 644 input.json
   ```

2. **Check directory permissions**:
   ```bash
   ls -la output/
   chmod 755 output/
   ```

3. **Use sudo (if necessary)**:
   ```bash
   sudo node dist/cli.js input.json
   ```

### Node.js Version Issues

**Problem**: `SyntaxError: Unexpected token` or other syntax errors

**Solutions**:
1. **Check Node.js version**:
   ```bash
   node --version
   # Should be 16.0 or higher
   ```

2. **Update Node.js**:
   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   
   # Or download from nodejs.org
   ```

## Error Messages

### Exit Code 1: Validation Errors

**Problem**: Validation failed with specific field errors

**Solutions**:

#### Missing Required Fields

```
Error: Validation failed
- 3 records missing required field '_id'
```

**Fix**:
1. **Check your data structure**:
   ```json
   {
     "leads": [
       {
         "_id": "required-field",
         "email": "required-field",
         "entryDate": "required-field"
       }
     ]
   }
   ```

2. **Add missing fields**:
   ```bash
   # Use a text editor to add missing _id fields
   sed -i 's/"email": "test@example.com"/"_id": "auto-generated", "email": "test@example.com"/g' input.json
   ```

#### Invalid Date Formats

```
Error: Validation failed
- 2 records have invalid date format in 'entryDate'
- Example invalid record: {"email": "test@example.com", "entryDate": "invalid-date"}
```

**Fix**:
1. **Check supported date formats**:
   - ISO 8601: `2014-05-07T17:30:20+00:00`
   - RFC 3339: `2014-05-07T17:30:20Z`
   - Unix Timestamp: `1399483820`
   - YYYY-MM-DD: `2014-05-07`
   - MM/DD/YYYY: `05/07/2014`

2. **Convert invalid dates**:
   ```bash
   # Convert MM/DD/YYYY to YYYY-MM-DD
   sed -i 's/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)/\3-\1-\2/g' input.json
   ```

3. **Use different timestamp key**:
   ```bash
   node dist/cli.js input.json --timestamp-key createdAt
   ```

#### Empty Values

```
Error: Validation failed
- 5 records have empty values in required fields
```

**Fix**:
1. **Remove records with empty values**:
   ```bash
   # Use jq to filter out records with empty _id
   jq '.leads |= map(select(._id != null and ._id != ""))' input.json > cleaned.json
   ```

2. **Fill empty values**:
   ```bash
   # Replace empty strings with null or default values
   sed -i 's/"firstName": ""/"firstName": null/g' input.json
   ```

### Exit Code 2: I/O Errors

**Problem**: File not found or cannot be read/written

**Solutions**:

#### File Not Found

```
Error: ENOENT: no such file or directory, open 'input.json'
```

**Fix**:
1. **Check file path**:
   ```bash
   ls -la input.json
   pwd
   ```

2. **Use absolute path**:
   ```bash
   node dist/cli.js /full/path/to/input.json
   ```

3. **Check file extension**:
   ```bash
   # List all JSON files
   ls *.json
   ```

#### Permission Denied

```
Error: EACCES: permission denied, open 'input.json'
```

**Fix**:
1. **Check file permissions**:
   ```bash
   ls -la input.json
   chmod 644 input.json
   ```

2. **Check directory permissions**:
   ```bash
   ls -la .
   chmod 755 .
   ```

#### Disk Space Issues

```
Error: ENOSPC: no space left on device
```

**Fix**:
1. **Check disk space**:
   ```bash
   df -h
   du -sh *
   ```

2. **Clean up space**:
   ```bash
   # Remove old output files
   rm -f *_deduplicated_*.json
   rm -f *_changes_*.log
   ```

### Exit Code 3: General Errors

**Problem**: Cross-conflicts or processing errors

**Solutions**:

#### Cross-Conflicts

```
Error: Cross-conflict detected
- Record with _id 'id1' conflicts with record with _id 'id2' by email
- Both records have email 'user@example.com' but different _id values
```

**Fix**:
1. **This is a data integrity issue** - the same email has different IDs
2. **Review your data**:
   ```bash
   # Find all records with the conflicting email
   jq '.leads[] | select(.email == "user@example.com")' input.json
   ```

3. **Decide on resolution strategy**:
   - Keep the record with the newest date
   - Manually review and fix the data
   - Use a different deduplication strategy

#### Processing Errors

```
Error: Processing failed: Unexpected error during deduplication
```

**Fix**:
1. **Enable verbose mode**:
   ```bash
   node dist/cli.js input.json --verbose
   ```

2. **Check for malformed JSON**:
   ```bash
   jq . input.json > /dev/null
   ```

3. **Use dry-run mode**:
   ```bash
   node dist/cli.js input.json --dry-run
   ```

## Performance Issues

### Slow Processing

**Problem**: Tool is taking too long to process large files

**Solutions**:

1. **Enable performance monitoring**:
   ```bash
   node dist/cli.js large-file.json --verbose
   ```

2. **Increase memory limit**:
   ```bash
   node --max-old-space-size=8192 dist/cli.js large-file.json
   ```

3. **Use quiet mode**:
   ```bash
   node dist/cli.js large-file.json --quiet
   ```

4. **Enable garbage collection**:
   ```bash
   node --expose-gc dist/cli.js large-file.json
   ```

5. **Process in smaller batches**:
   ```bash
   export BATCH_SIZE=5000
   node dist/cli.js large-file.json
   ```

### High Memory Usage

**Problem**: Tool is using too much memory

**Solutions**:

1. **Monitor memory usage**:
   ```bash
   # In another terminal
   watch -n 1 'ps aux | grep node'
   ```

2. **Reduce batch size**:
   ```bash
   export BATCH_SIZE=1000
   node dist/cli.js large-file.json
   ```

3. **Use streaming for very large files**:
   ```bash
   # Split large file into chunks
   split -l 10000 large-file.json chunk_
   
   # Process each chunk
   for file in chunk_*; do
     node dist/cli.js "$file" -o "output_$file"
   done
   ```

4. **Enable garbage collection**:
   ```bash
   node --expose-gc dist/cli.js large-file.json
   ```

## Memory Issues

### Out of Memory Errors

**Problem**: `FATAL ERROR: Ineffective mark-compacts near heap limit`

**Solutions**:

1. **Increase heap size**:
   ```bash
   node --max-old-space-size=8192 dist/cli.js large-file.json
   ```

2. **Process smaller files**:
   ```bash
   # Split large file
   split -l 5000 large-file.json chunk_
   ```

3. **Use external sorting**:
   ```bash
   # Sort by date to optimize deduplication
   jq -s '.[0].leads | sort_by(.entryDate)' large-file.json > sorted.json
   node dist/cli.js sorted.json
   ```

### Memory Warnings

**Problem**: `Memory usage high: 85.2%`

**Solutions**:

1. **This is a warning, not an error** - the tool will continue
2. **Monitor system resources**:
   ```bash
   htop
   free -h
   ```

3. **Close other applications** to free up memory
4. **Restart the tool** if memory usage becomes critical

## Validation Issues

### Date Parsing Problems

**Problem**: Dates are not being parsed correctly

**Solutions**:

1. **Check date format**:
   ```bash
   # Extract a sample date
   jq '.leads[0].entryDate' input.json
   ```

2. **Use verbose mode to see parsing details**:
   ```bash
   node dist/cli.js input.json --verbose
   ```

3. **Convert dates to supported format**:
   ```bash
   # Convert various formats to ISO 8601
   jq '.leads |= map(.entryDate |= (if . | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$") then . + "T00:00:00Z" else . end))' input.json > converted.json
   ```

4. **Use different timestamp key**:
   ```bash
   node dist/cli.js input.json --timestamp-key createdAt
   ```

### Field Validation Issues

**Problem**: Required fields are missing or invalid

**Solutions**:

1. **Check data structure**:
   ```bash
   # View structure of first record
   jq '.leads[0]' input.json
   ```

2. **Find records with missing fields**:
   ```bash
   # Find records without _id
   jq '.leads[] | select(._id == null or ._id == "")' input.json
   ```

3. **Add missing fields**:
   ```bash
   # Add _id field based on email
   jq '.leads |= map(if ._id == null or ._id == "" then . + {"_id": .email} else . end)' input.json > fixed.json
   ```

## File I/O Issues

### Output File Issues

**Problem**: Cannot write output file

**Solutions**:

1. **Check directory permissions**:
   ```bash
   ls -la output/
   mkdir -p output
   chmod 755 output
   ```

2. **Use absolute path**:
   ```bash
   node dist/cli.js input.json -o /full/path/to/output.json
   ```

3. **Check disk space**:
   ```bash
   df -h
   ```

4. **Use different output location**:
   ```bash
   node dist/cli.js input.json -o /tmp/output.json
   ```

### Log File Issues

**Problem**: Cannot write log file

**Solutions**:

1. **Check log directory**:
   ```bash
   ls -la logs/
   mkdir -p logs
   chmod 755 logs
   ```

2. **Use absolute path**:
   ```bash
   node dist/cli.js input.json --log-file /full/path/to/changes.log
   ```

3. **Disable logging** (if not needed):
   ```bash
   # Don't specify log file - it will use default location
   node dist/cli.js input.json
   ```

### Backup File Issues

**Problem**: Cannot create backup files

**Solutions**:

1. **Check backup directory**:
   ```bash
   ls -la backups/
   mkdir -p backups
   chmod 755 backups
   ```

2. **Disable backups**:
   ```bash
   # The tool doesn't have a --no-backup option, but you can
   # manually manage backups by copying files before processing
   cp input.json input.json.backup
   node dist/cli.js input.json
   ```

## Debug Mode

### Enable Debug Logging

**Problem**: Need more detailed information about what's happening

**Solutions**:

1. **Enable debug mode**:
   ```bash
   DEBUG=* node dist/cli.js input.json
   ```

2. **Enable specific debug categories**:
   ```bash
   DEBUG=json-dedupe:* node dist/cli.js input.json
   ```

3. **Enable verbose mode**:
   ```bash
   node dist/cli.js input.json --verbose
   ```

4. **Use dry-run mode**:
   ```bash
   node dist/cli.js input.json --dry-run
   ```

### Debug Output Examples

```
DEBUG=json-dedupe:parser Parsing file: input.json
DEBUG=json-dedupe:validator Validating 1000 records
DEBUG=json-dedupe:engine Detecting conflicts...
DEBUG=json-dedupe:engine Found 5 conflicts
DEBUG=json-dedupe:output Writing output to: output.json
```

### Common Debug Scenarios

1. **Parsing issues**:
   ```bash
   DEBUG=json-dedupe:parser node dist/cli.js input.json
   ```

2. **Validation issues**:
   ```bash
   DEBUG=json-dedupe:validator node dist/cli.js input.json
   ```

3. **Deduplication issues**:
   ```bash
   DEBUG=json-dedupe:engine node dist/cli.js input.json
   ```

4. **Output issues**:
   ```bash
   DEBUG=json-dedupe:output node dist/cli.js input.json
   ```

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Enable verbose mode**: `--verbose`
3. **Use dry-run mode**: `--dry-run`
4. **Enable debug logging**: `DEBUG=*`
5. **Check the documentation**: `README.md` and `docs/API.md`

### Information to Include

When asking for help, include:

1. **Error message** (exact text)
2. **Command used**
3. **Input file structure** (sample)
4. **Node.js version**: `node --version`
5. **Operating system**: `uname -a`
6. **File sizes**: `ls -lh input.json`
7. **Debug output** (if available)

### Example Help Request

```
Error: Validation failed
- 3 records missing required field '_id'

Command: node dist/cli.js leads.json --verbose

Node.js version: v18.15.0
OS: macOS 13.2.1

Input file structure:
{
  "leads": [
    {
      "email": "test@example.com",
      "entryDate": "2014-05-07T17:30:20+00:00"
    }
  ]
}

File size: 1.2M
```

### Additional Resources

- **README.md**: Installation and basic usage
- **docs/API.md**: Programmatic usage and API reference
- **GitHub Issues**: Check existing issues and solutions
- **Stack Overflow**: Search for similar problems

---

**Note**: Most issues can be resolved by carefully reading error messages and using the verbose/debug modes to understand what the tool is doing.
