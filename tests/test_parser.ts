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
      }).toThrow('Record at index 1 in "leads": must be an object');
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

      const records = JsonParser.parseContent(content);
      expect(records).toHaveLength(1);
      
      // The validation should fail when we validate the record
      const validation = records[0]!.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing or empty email field');
    });
  });

  describe('parseContent with multiple keys', () => {
    test('should parse multiple keys', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'lead1',
            email: 'lead1@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          }
        ],
        users: [
          {
            _id: 'user1',
            email: 'user1@example.com',
            entryDate: '2014-05-07T17:31:20+00:00'
          }
        ]
      });

      const records = JsonParser.parseContent(content, ['leads', 'users']);

      expect(records).toHaveLength(2);
      expect(records[0]?._id).toBe('lead1');
      expect(records[1]?._id).toBe('user1');
    });

    test('should parse single custom key', () => {
      const content = JSON.stringify({
        users: [
          {
            _id: 'user1',
            email: 'user1@example.com',
            entryDate: '2014-05-07T17:31:20+00:00'
          }
        ]
      });

      const records = JsonParser.parseContent(content, ['users']);

      expect(records).toHaveLength(1);
      expect(records[0]?._id).toBe('user1');
      expect(records[0]?.email).toBe('user1@example.com');
    });

    test('should throw error for missing key', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'lead1',
            email: 'lead1@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          }
        ]
      });

      expect(() => {
        JsonParser.parseContent(content, ['leads', 'missing_key']);
      }).toThrow('JSON must contain a "missing_key" array');
    });

    test('should throw error for non-array key', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'lead1',
            email: 'lead1@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          }
        ],
        users: 'not an array'
      });

      expect(() => {
        JsonParser.parseContent(content, ['leads', 'users']);
      }).toThrow('"users" field must be an array');
    });

    test('should include key name in error messages', () => {
      const content = JSON.stringify({
        leads: [
          {
            _id: 'lead1',
            email: 'lead1@example.com',
            entryDate: '2014-05-07T17:30:20+00:00'
          }
        ],
        users: [
          'invalid record'
        ]
      });

      expect(() => {
        JsonParser.parseContent(content, ['leads', 'users']);
      }).toThrow('Record at index 0 in "users": must be an object');
    });
  });

  describe('integration tests with fixture files', () => {
    test('should parse multi-key fixture file', () => {
      const fs = require('fs');
      const path = require('path');
      
      const fixturePath = path.join(__dirname, 'fixtures', 'multi-key-data.json');
      const content = fs.readFileSync(fixturePath, 'utf8');
      
      const records = JsonParser.parseContent(content, ['leads', 'users', 'customers']);
      
      expect(records).toHaveLength(5); // 2 leads + 2 users + 1 customer
      expect(records.some(r => r._id === 'lead1')).toBe(true);
      expect(records.some(r => r._id === 'user1')).toBe(true);
      expect(records.some(r => r._id === 'customer1')).toBe(true);
    });

    test('should parse multi-file fixture files', () => {
      const fs = require('fs');
      const path = require('path');
      
      const fixture1Path = path.join(__dirname, 'fixtures', 'multi-file-data-1.json');
      const fixture2Path = path.join(__dirname, 'fixtures', 'multi-file-data-2.json');
      
      const content1 = fs.readFileSync(fixture1Path, 'utf8');
      const content2 = fs.readFileSync(fixture2Path, 'utf8');
      
      const records1 = JsonParser.parseContent(content1, ['leads', 'users']);
      const records2 = JsonParser.parseContent(content2, ['leads', 'customers']);
      
      expect(records1).toHaveLength(5); // 3 leads + 2 users
      expect(records2).toHaveLength(5); // 3 leads + 2 customers
      
      // Check for overlapping record (lead1 appears in both files)
      const lead1Records = [...records1, ...records2].filter(r => r._id === 'lead1');
      expect(lead1Records).toHaveLength(2);
      
      // Check dates are different for lead1
      const dates = lead1Records.map(r => r.entryDate);
      expect(dates[0]).not.toBe(dates[1]);
    });

    test('should handle missing keys gracefully', () => {
      const fs = require('fs');
      const path = require('path');
      
      const fixturePath = path.join(__dirname, 'fixtures', 'multi-key-data.json');
      const content = fs.readFileSync(fixturePath, 'utf8');
      
      // Try to parse with a key that doesn't exist
      expect(() => {
        JsonParser.parseContent(content, ['leads', 'nonexistent']);
      }).toThrow('JSON must contain a "nonexistent" array');
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
