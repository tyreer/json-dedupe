# Troubleshooting Guide

Quick solutions for common issues with the JSON Deduplication Tool.

## Common Issues

### Tool Not Found

**Problem**: `command not found: json-dedupe`

**Solution**:
```bash
npm run build
node dist/json-dedupe.js input.json
```

### Key Names Issues

**Problem**: `JSON must contain a "missing_key" array`

**Solution**:
```bash
# Check what keys are available in your JSON file
cat input.json | jq 'keys'

# Use correct key names
node dist/json-dedupe.js input.json --key-names "leads,users"
```

**Problem**: `"users" field must be an array`

**Solution**:
```bash
# Check the structure of your JSON
cat input.json | jq '.users'

# Ensure the key contains an array, not an object or string
```

**Problem**: `Duplicate key names are not allowed`

**Solution**:
```bash
# Remove duplicate key names from the list
node dist/json-dedupe.js input.json --key-names "leads,users"  # Correct
node dist/json-dedupe.js input.json --key-names "leads,leads"  # Wrong
```

### Permission Denied

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
chmod 644 input.json
chmod 755 output/
```

### Node.js Version Issues

**Problem**: Syntax errors or compatibility issues

**Solution**:
```bash
node --version  # Should be 16.0+
nvm install 18  # Update if needed
```

## Error Messages

### Exit Code 1: Validation Errors

**Missing Required Fields**:
```bash
# Check data structure matches expected format
node dist/json-dedupe.js input.json --verbose
```

**Invalid Date Format**:
```bash
# Use different timestamp key
node dist/json-dedupe.js input.json --timestamp-key createdAt
```

**Key Names Validation Errors**:
```bash
# Check that specified keys exist in JSON
node dist/json-dedupe.js input.json --key-names "leads,users" --verbose

# Ensure keys contain arrays, not objects or strings
node dist/json-dedupe.js input.json --key-names "leads" --verbose

# Avoid duplicate key names
node dist/json-dedupe.js input.json --key-names "leads,leads"  # This will fail
```

### Exit Code 2: I/O Errors

**File Not Found**:
```bash
# Check file path and permissions
ls -la input.json
```

**Permission Denied**:
```bash
# Fix permissions
chmod 644 input.json
chmod 755 output/
```

### Exit Code 3: Processing Errors

**Memory Issues**:
```bash
# Increase memory limit
node --max-old-space-size=8192 dist/json-dedupe.js large-file.json

# Use smaller batches
export BATCH_SIZE=5000
node dist/json-dedupe.js large-file.json
```

## Performance Issues

### Slow Processing

**Large Files**:
```bash
# Use quiet mode for better performance
node dist/json-dedupe.js large-file.json --quiet

# Increase memory limit
node --max-old-space-size=8192 dist/json-dedupe.js large-file.json
```

### High Memory Usage

**Memory Warnings**:
```bash
# Reduce batch size
export BATCH_SIZE=5000

# Enable garbage collection
node --expose-gc dist/json-dedupe.js large-file.json
```

## Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
DEBUG=* node dist/json-dedupe.js input.json

# Use verbose mode
node dist/json-dedupe.js input.json --verbose
```

## Getting Help

1. **Check error messages** - They include specific examples and counts
2. **Use dry-run mode** - See what would be processed without changes
3. **Enable verbose mode** - Get detailed processing information
4. **Check file permissions** - Ensure read/write access to files and directories

## Quick Fixes

| Problem | Solution |
|---------|----------|
| Tool not found | `npm run build` |
| Permission denied | `chmod 644 input.json` |
| Memory errors | `node --max-old-space-size=8192` |
| Slow processing | `--quiet` flag |
| Date parsing issues | `--timestamp-key` option |
| Validation errors | Check required fields and formats |
| Missing key error | `--key-names "leads,users"` |
| Key not array error | Check JSON structure with `jq` |
| Duplicate keys error | Remove duplicate key names |
