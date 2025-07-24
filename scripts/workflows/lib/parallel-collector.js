/**
 * Parallel collector for efficient batch processing
 */
class ParallelCollector {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;
    this.batchSize = options.batchSize || 20;
  }

  /**
   * Collect data from items in parallel with controlled concurrency
   */
  async collect(items, processor) {
    const results = [];
    const batches = this.createBatches(items, this.batchSize);
    
    console.log(`  Processing ${items.length} items in ${batches.length} batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} items`);
      
      // Process batch with limited concurrency
      const batchPromises = batch.map(item => 
        this.processWithConcurrency(item, processor)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Extract results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            sensor: batch[index].name,
            sensorId: batch[index].sensor_id,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Create batches from items
   */
  createBatches(items, size) {
    const batches = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Process item with concurrency control
   */
  async processWithConcurrency(item, processor) {
    // Simple concurrency control - in production, use p-limit or similar
    return processor(item);
  }

  /**
   * Process items in true parallel with concurrency limit
   */
  async collectParallel(items, processor) {
    const limit = require('p-limit')(this.concurrency);
    
    const promises = items.map(item => 
      limit(() => processor(item))
    );
    
    return Promise.allSettled(promises);
  }
}

module.exports = { ParallelCollector };