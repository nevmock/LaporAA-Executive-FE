// Simple rate limiter to prevent too many API calls
class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    isAllowed(key: string): boolean {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        // Get existing requests for this key
        const keyRequests = this.requests.get(key) || [];
        
        // Filter out old requests
        const recentRequests = keyRequests.filter(time => time > windowStart);
        
        // Check if under limit
        if (recentRequests.length >= this.maxRequests) {
            console.warn(`Rate limit exceeded for ${key}. ${recentRequests.length}/${this.maxRequests} requests in last ${this.windowMs}ms`);
            return false;
        }
        
        // Add current request
        recentRequests.push(now);
        this.requests.set(key, recentRequests);
        
        return true;
    }

    reset(key?: string) {
        if (key) {
            this.requests.delete(key);
        } else {
            this.requests.clear();
        }
    }
}

// Export singleton instance
export const apiRateLimiter = new RateLimiter(60000, 15); // 15 requests per minute
export const botModeRateLimiter = new RateLimiter(30000, 5); // 5 requests per 30 seconds for bot mode

export default RateLimiter;
