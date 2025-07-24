/**
 * Retry handler with exponential backoff
 */
class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoff = options.backoff || 'exponential';
    this.retryableErrors = options.retryableErrors || [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'EPIPE',
      'EAI_AGAIN'
    ];
    this.retryableStatusCodes = options.retryableStatusCodes || [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ];
  }

  async execute(fn, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms: ${error.message}`);
        
        await this.delay(delay);
      }
    }
    
    throw new Error(`Failed after ${this.maxRetries} retries: ${lastError.message}`);
  }

  shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries) return false;
    
    // Check network errors
    if (error.code && this.retryableErrors.includes(error.code)) {
      return true;
    }
    
    // Check HTTP status codes
    if (error.status && this.retryableStatusCodes.includes(error.status)) {
      return true;
    }
    
    // Check for specific error messages
    const errorMessage = error.message?.toLowerCase() || '';
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'econnreset',
      'socket hang up'
    ];
    
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  calculateDelay(attempt) {
    if (this.backoff === 'exponential') {
      const delay = Math.min(
        this.initialDelay * Math.pow(2, attempt),
        this.maxDelay
      );
      // Add jitter to prevent thundering herd
      return delay + Math.random() * 1000;
    }
    return this.initialDelay;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RetryHandler };