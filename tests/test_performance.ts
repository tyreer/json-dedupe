import { 
  PerformanceMonitor, 
  MemoryManager, 
  TimeoutManager, 
  DatasetOptimizer
} from '../src/performance';
import { LeadRecord } from '../src/dedupe/models';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('basic functionality', () => {
    test('should create performance monitor instance', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    test('should start monitoring', () => {
      monitor.start();
      // No assertion needed - just checking it doesn't throw
      expect(true).toBe(true);
    });

    test('should stop monitoring and return metrics', () => {
      monitor.start();
      
      // Simulate some processing time
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Wait 10ms
      }
      
      const metrics = monitor.stop(100);
      
      expect(metrics).toBeDefined();
      expect(metrics.recordCount).toBe(100);
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.startTime).toBeLessThan(metrics.endTime);
    });
  });

  describe('memory usage tracking', () => {
    test('should track memory usage', () => {
      monitor.start();
      
      // Simulate memory usage increase
      new Array(10000).fill('test');
      monitor.updateMemoryUsage();
      
      const metrics = monitor.stop(100);
      
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.initial).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage.peak).toBeGreaterThanOrEqual(metrics.memoryUsage.initial);
      expect(metrics.memoryUsage.final).toBeGreaterThanOrEqual(0);
    });
  });

  describe('static utility methods', () => {
    test('should format memory size correctly', () => {
      expect(PerformanceMonitor.formatMemory(1024)).toBe('1.0 KB');
      expect(PerformanceMonitor.formatMemory(1024 * 1024)).toBe('1.0 MB');
      expect(PerformanceMonitor.formatMemory(500)).toBe('500.0 B');
      expect(PerformanceMonitor.formatMemory(1536)).toBe('1.5 KB');
    });

    test('should format duration correctly', () => {
      expect(PerformanceMonitor.formatDuration(500)).toBe('500ms');
      expect(PerformanceMonitor.formatDuration(1500)).toBe('1.5s');
      expect(PerformanceMonitor.formatDuration(65000)).toBe('1m 5.0s');
    });

    test('should format processing rate correctly', () => {
      expect(PerformanceMonitor.formatProcessingRate(500)).toBe('500.0 records/sec');
      expect(PerformanceMonitor.formatProcessingRate(1500)).toBe('1.5k records/sec');
    });
  });
});

describe('MemoryManager', () => {
  describe('memory usage checking', () => {
    test('should check memory usage', () => {
      const result = MemoryManager.checkMemoryUsage();
      
      expect(result).toBeDefined();
      expect(result.isAcceptable).toBeDefined();
      expect(result.usage).toBeGreaterThanOrEqual(0);
      expect(result.threshold).toBe(0.8);
    });

    test('should get memory statistics', () => {
      const stats = MemoryManager.getMemoryStats();
      
      expect(stats).toBeDefined();
      expect(stats.heapUsed).toBeGreaterThanOrEqual(0);
      expect(stats.heapTotal).toBeGreaterThanOrEqual(0);
      expect(stats.external).toBeGreaterThanOrEqual(0);
      expect(stats.rss).toBeGreaterThanOrEqual(0);
      expect(stats.usageRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('batch processing', () => {
    test('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processor = jest.fn().mockImplementation((batch: number[]) => 
        Promise.resolve(batch.map(x => x * 2))
      );

      const results = await MemoryManager.processInBatches(items, processor, 3);

      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
      expect(processor).toHaveBeenCalledTimes(4); // 10 items / 3 batch size = 4 batches
    });

    test('should handle empty array', async () => {
      const processor = jest.fn().mockResolvedValue([]);
      const results = await MemoryManager.processInBatches([], processor);

      expect(results).toEqual([]);
      expect(processor).not.toHaveBeenCalled();
    });
  });

  describe('garbage collection', () => {
    test('should force garbage collection if available', () => {
      // This test just ensures the method doesn't throw
      expect(() => MemoryManager.forceGarbageCollection()).not.toThrow();
    });
  });
});

describe('TimeoutManager', () => {
  describe('timeout execution', () => {
    test('should execute function within timeout', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await TimeoutManager.withTimeout(fn, 1000);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should throw error on timeout', async () => {
      const fn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      await expect(TimeoutManager.withTimeout(fn, 50)).rejects.toThrow('Operation timed out');
    });

    test('should handle function errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Function error'));
      
      await expect(TimeoutManager.withTimeout(fn, 1000)).rejects.toThrow('Function error');
    });
  });

  describe('abort checking', () => {
      test('should check if operation should be aborted', () => {
    const startTime = Date.now();
    
    expect(TimeoutManager.shouldAbort(startTime, 1000)).toBe(false);
    
    // Simulate time passing by using a past time
    const pastTime = startTime - 2000;
    expect(TimeoutManager.shouldAbort(pastTime, 1000)).toBe(true);
  });
  });
});

describe('DatasetOptimizer', () => {
  describe('large dataset optimization', () => {
    test('should optimize small datasets', () => {
      const records = Array(5000).fill(null).map((_, i) => 
        new LeadRecord({
          _id: `id${i}`,
          email: `test${i}@example.com`,
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      );

      const optimization = DatasetOptimizer.optimizeForLargeDataset(records);

      expect(optimization.shouldUseBatching).toBe(false);
      expect(optimization.batchSize).toBe(5000);
      expect(optimization.estimatedMemoryUsage).toBe(5000 * 1024);
    });

    test('should optimize large datasets', () => {
      const records = Array(15000).fill(null).map((_, i) => 
        new LeadRecord({
          _id: `id${i}`,
          email: `test${i}@example.com`,
          entryDate: '2014-05-07T17:30:20+00:00'
        })
      );

      const optimization = DatasetOptimizer.optimizeForLargeDataset(records);

      expect(optimization.shouldUseBatching).toBe(true);
      expect(optimization.batchSize).toBe(5000);
      expect(optimization.estimatedMemoryUsage).toBe(15000 * 1024);
    });
  });

  describe('array optimization', () => {
    test('should pre-allocate array', () => {
      const array = DatasetOptimizer.preAllocateArray(5, 'default');
      
      expect(array).toHaveLength(5);
      expect(array).toEqual(['default', 'default', 'default', 'default', 'default']);
    });

    test('should pre-allocate array without default value', () => {
      const array = DatasetOptimizer.preAllocateArray(3);
      
      expect(array).toHaveLength(3);
      expect(array).toEqual([undefined, undefined, undefined]);
    });
  });

  describe('batch processing with progress', () => {
    test('should process records with progress callback', async () => {
      const records = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processor = jest.fn().mockImplementation((batch: number[]) => 
        Promise.resolve(batch.map(x => x * 2))
      );
      const progressCallback = jest.fn();

      const results = await DatasetOptimizer.processRecordsWithProgress(
        records, 
        processor, 
        progressCallback, 
        3
      );

      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
      expect(progressCallback).toHaveBeenCalled();
      
      // Check that progress was reported
      const progressCalls = progressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(0);
      
      // Check last progress call shows 100%
      const lastCall = progressCalls[progressCalls.length - 1];
      expect(lastCall[2]).toBe(100); // percentage
    });

    test('should process records without progress callback', async () => {
      const records = [1, 2, 3];
      const processor = jest.fn().mockImplementation((batch: number[]) => 
        Promise.resolve(batch.map(x => x * 2))
      );

      const results = await DatasetOptimizer.processRecordsWithProgress(records, processor);

      expect(results).toEqual([2, 4, 6]);
      expect(processor).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Performance integration', () => {
  test('should integrate performance monitoring with memory management', () => {
    const monitor = new PerformanceMonitor();
    monitor.start();

    // Simulate some work with a delay
    const startTime = Date.now();
    while (Date.now() - startTime < 10) {
      // Wait 10ms
    }
    new Array(1000).fill('test');
    monitor.updateMemoryUsage();

    const metrics = monitor.stop(1000);

    expect(metrics.recordCount).toBe(1000);
    expect(metrics.processingRate).toBeGreaterThan(0);
    expect(metrics.memoryEfficiency).toBeGreaterThan(0);
  });

  test('should handle memory warnings', () => {
    // Mock process.memoryUsage to simulate high memory usage
    const originalMemoryUsage = process.memoryUsage;
    (process as any).memoryUsage = jest.fn().mockReturnValue({
      heapUsed: 8000000000, // 8GB
      heapTotal: 10000000000, // 10GB
      external: 0,
      rss: 0
    });

    const memoryCheck = MemoryManager.checkMemoryUsage();
    
    expect(memoryCheck.isAcceptable).toBe(false);
    expect(memoryCheck.usage).toBe(0.8);

    // Restore original
    process.memoryUsage = originalMemoryUsage;
  });
});
