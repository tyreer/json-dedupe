import { LeadRecord } from './dedupe/models';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  recordCount: number;
  processingRate: number; // records per second
  memoryEfficiency: number; // bytes per record
}

/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceMonitor {
  private startTime: number = 0;
  private peakMemory: number = 0;
  private initialMemory: number = 0;

  /**
   * Start performance monitoring
   */
  public start(): void {
    this.startTime = Date.now();
    this.initialMemory = this.getMemoryUsage();
    this.peakMemory = this.initialMemory;
  }

  /**
   * Update peak memory usage
   */
  public updateMemoryUsage(): void {
    const currentMemory = this.getMemoryUsage();
    if (currentMemory > this.peakMemory) {
      this.peakMemory = currentMemory;
    }
  }

  /**
   * Get current memory usage in bytes
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed;
    }
    return 0;
  }

  /**
   * Stop monitoring and calculate metrics
   */
  public stop(recordCount: number): PerformanceMetrics {
    const endTime = Date.now();
    const finalMemory = this.getMemoryUsage();
    const duration = endTime - this.startTime;
    const processingRate = duration > 0 ? (recordCount / duration) * 1000 : 0;
    const memoryEfficiency = recordCount > 0 ? this.peakMemory / recordCount : 0;

    return {
      startTime: this.startTime,
      endTime,
      duration,
      memoryUsage: {
        initial: this.initialMemory,
        peak: this.peakMemory,
        final: finalMemory
      },
      recordCount,
      processingRate,
      memoryEfficiency
    };
  }

  /**
   * Format memory size in human-readable format
   */
  public static formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format duration in human-readable format
   */
  public static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format processing rate
   */
  public static formatProcessingRate(rate: number): string {
    if (rate >= 1000) {
      return `${(rate / 1000).toFixed(1)}k records/sec`;
    } else {
      return `${rate.toFixed(1)} records/sec`;
    }
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static readonly MEMORY_THRESHOLD = 0.8; // 80% of available memory
  private static readonly BATCH_SIZE = 10000; // Process records in batches

  /**
   * Check if memory usage is acceptable
   */
  public static checkMemoryUsage(): { isAcceptable: boolean; usage: number; threshold: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal;
      const usedMemory = usage.heapUsed;
      const usageRatio = usedMemory / totalMemory;
      
      return {
        isAcceptable: usageRatio < this.MEMORY_THRESHOLD,
        usage: usageRatio,
        threshold: this.MEMORY_THRESHOLD
      };
    }
    
    return {
      isAcceptable: true,
      usage: 0,
      threshold: this.MEMORY_THRESHOLD
    };
  }

  /**
   * Process records in batches to manage memory
   */
  public static async processInBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = this.BATCH_SIZE
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Memory usage monitoring removed for cleaner test output
      
      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
    }
    
    return results;
  }

  /**
   * Force garbage collection if available
   */
  public static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get memory usage statistics
   */
  public static getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    usageRatio: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        usageRatio: usage.heapUsed / usage.heapTotal
      };
    }
    
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      usageRatio: 0
    };
  }
}

/**
 * Timeout management utilities
 */
export class TimeoutManager {
  private static readonly DEFAULT_TIMEOUT = 300000; // 5 minutes

  /**
   * Execute a function with timeout
   */
  public static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Check if operation should be aborted due to timeout
   */
  public static shouldAbort(startTime: number, timeoutMs: number): boolean {
    return Date.now() - startTime > timeoutMs;
  }
}

/**
 * Performance optimization utilities for large datasets
 */
export class DatasetOptimizer {
  /**
   * Optimize record processing for large datasets
   */
  public static optimizeForLargeDataset(records: LeadRecord[]): {
    shouldUseBatching: boolean;
    batchSize: number;
    estimatedMemoryUsage: number;
  } {
    const recordCount = records.length;
    const estimatedMemoryPerRecord = 1024; // Rough estimate in bytes
    const estimatedMemoryUsage = recordCount * estimatedMemoryPerRecord;
    
    // Use batching for datasets larger than 10,000 records
    const shouldUseBatching = recordCount > 10000;
    const batchSize = shouldUseBatching ? 5000 : recordCount;
    
    return {
      shouldUseBatching,
      batchSize,
      estimatedMemoryUsage
    };
  }

  /**
   * Pre-allocate arrays for better performance
   */
  public static preAllocateArray<T>(size: number, defaultValue?: T): T[] {
    const array = new Array<T>(size);
    if (defaultValue !== undefined) {
      array.fill(defaultValue);
    }
    return array;
  }

  /**
   * Optimize Map usage for large datasets
   */
  public static createOptimizedMap<K, V>(_initialSize?: number): Map<K, V> {
    return new Map<K, V>();
  }

  /**
   * Batch process records with progress reporting
   */
  public static async processRecordsWithProgress<T, R>(
    records: T[],
    processor: (batch: T[]) => Promise<R[]>,
    progressCallback?: (current: number, total: number, percentage: number) => void,
    batchSize: number = 5000
  ): Promise<R[]> {
    const results: R[] = [];
    const total = records.length;
    
    for (let i = 0; i < total; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      if (progressCallback) {
        const current = Math.min(i + batchSize, total);
        const percentage = (current / total) * 100;
        progressCallback(current, total, percentage);
      }
      
      // Memory management
      MemoryManager.forceGarbageCollection();
    }
    
    return results;
  }
}
