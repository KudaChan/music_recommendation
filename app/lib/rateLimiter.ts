// Simple rate limiter for API endpoints
type RateLimitEntry = {
  count: number;
  resetTime: number;
};

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly defaultLimit: number = 100; // Default requests per window
  private readonly defaultWindow: number = 60 * 60 * 1000; // Default window of 1 hour in ms
  
  // Check if a key has exceeded its rate limit
  isRateLimited(key: string, limit: number = this.defaultLimit, windowMs: number = this.defaultWindow): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // If no entry exists or the window has expired, create a new entry
    if (!entry || entry.resetTime < now) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }
    
    // Increment the count
    entry.count++;
    
    // Check if the limit has been exceeded
    return entry.count > limit;
  }
  
  // Get remaining requests for a key
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || entry.resetTime < now) {
      return this.defaultLimit;
    }
    
    return Math.max(0, this.defaultLimit - entry.count);
  }
  
  // Get time until reset for a key (in seconds)
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || entry.resetTime < now) {
      return 0;
    }
    
    return Math.ceil((entry.resetTime - now) / 1000);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();