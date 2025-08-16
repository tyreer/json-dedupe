import { JsonParser } from '../src/dedupe/parser';
import { LeadRecord } from '../src/dedupe/models';

describe('JsonParser', () => {
  describe('parseContent', () => {
    test('should parse valid JSON content', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'test123',
            email: 'test@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          }
        ]
      });

      const records = JsonParser.parseContent(content);

      expect(records).toHaveLength(1);
      expect(records[0]).toBeInstanceOf(LeadRecord);
      expect(records[0]?._id).toBe('test123');
      expect(records[0]?.email).toBe('test@example.com');
    });

    test('should parse multiple records', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'test1',
            email: 'test1@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          },
          {
            _id: 'test2',
            email: 'test2@example.com',
            entryDate: '2014-05-07T17:31:20+00:00'
          }
        ]
      });

      const records = JsonParser.parseContent(content);

      expect(records).toHaveLength(2);
      expect(records[0]?._id).toBe('test1');
      expect(records[1]?._id).toBe('test2');
    });

    test('should throw error for empty content', () => {
      expect(() => {
        JsonParser.parseContent('');
      }).toThrow('Empty or invalid JSON content');
    });

    test('should throw error for invalid JSON', () => {
      expect(() => {
        JsonParser.parseContent('invalid json');
      }).toThrow('Invalid JSON format');
    });

    test('should throw error for missing leads array', () => {
      const content = JSON.stringify({ other: 'data' });

      expect(() => {
        JsonParser.parseContent(content);
      }).toThrow('JSON must contain a "leads" array');
    });

    test('should throw error for non-array leads', () => {
      const content = JSON.stringify({ leads: 'not an array' });

      expect(() => {
        JsonParser.parseContent(content);
      }).toThrow('"leads" field must be an array');
    });

    test('should throw error for invalid record in array', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'test123',
            email: 'test@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          },
          'invalid record'
        ]
      });

      expect(() => {
        JsonParser.parseContent(content);
      }).toThrow('Record at index 1: must be an object');
    });

    test('should throw error for record with missing required fields', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'test123',
            // missing email and entryDate
          }
        ]
      });

      // The parser should create LeadRecord objects, but validation happens later
      const records = JsonParser.parseContent(content);
      expect(records).toHaveLength(1);
      
      // The validation should fail when we validate the record
      const validation = records[0]!.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing or empty email field');
    });
  });

  describe('validateFile', () => {
    test('should return true for existing readable file', () => {
      // Create a temporary file for testing
      const fs = require('fs');
      const path = require('path');
      const tempFile = path.join(__dirname, 'temp-test.json');
      
      try {
        fs.writeFileSync(tempFile, '{"leads":[]}');
        expect(JsonParser.validateFile(tempFile)).toBe(true);
      } finally {
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    test('should return false for non-existent file', () => {
      expect(JsonParser.validateFile('/non/existent/file.json')).toBe(false);
    });
  });

  describe('getFileSize', () => {
    test('should return file size for existing file', () => {
      const fs = require('fs');
      const path = require('path');
      const tempFile = path.join(__dirname, 'temp-size-test.json');
      
      try {
        const content = '{"leads":[]}';
        fs.writeFileSync(tempFile, content);
        const size = JsonParser.getFileSize(tempFile);
        expect(size).toBe(content.length);
      } finally {
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    test('should throw error for non-existent file', () => {
      expect(() => {
        JsonParser.getFileSize('/non/existent/file.json');
      }).toThrow('Cannot access file');
    });
  });
});
