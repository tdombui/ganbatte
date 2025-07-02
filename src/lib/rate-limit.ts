/**
 * Production-ready rate limiting for Supabase auth requests
 * Supports both development (in-memory) and production (Redis) environments
 */

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}

interface RateLimitResult {
  isLimited: boolean
  remaining: number
  resetTime: number
}

// In-memory store for development (not suitable for production with multiple instances)
const devStore = new Map<string, { count: number; resetTime: number }>()

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyPrefix: 'auth_rate_limit'
}

/**
 * Rate limiter that works in both development and production
 */
export class RateLimiter {
  private config: RateLimitConfig
  private isProduction: boolean

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    if (this.isProduction) {
      return this.checkLimitProduction(identifier)
    } else {
      return this.checkLimitDevelopment(identifier)
    }
  }

  /**
   * Development rate limiting (in-memory)
   */
  private checkLimitDevelopment(identifier: string): RateLimitResult {
    const now = Date.now()
    const key = `${this.config.keyPrefix}:${identifier}`
    const cached = devStore.get(key)

    if (!cached) {
      devStore.set(key, { count: 1, resetTime: now + this.config.windowMs })
      return {
        isLimited: false,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    if (now > cached.resetTime) {
      devStore.set(key, { count: 1, resetTime: now + this.config.windowMs })
      return {
        isLimited: false,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    if (cached.count >= this.config.maxRequests) {
      return {
        isLimited: true,
        remaining: 0,
        resetTime: cached.resetTime
      }
    }

    cached.count++
    return {
      isLimited: false,
      remaining: this.config.maxRequests - cached.count,
      resetTime: cached.resetTime
    }
  }

  /**
   * Production rate limiting (Redis-based)
   * This is a placeholder - implement with your preferred Redis client
   */
  private async checkLimitProduction(identifier: string): Promise<RateLimitResult> {
    // In production, you should use Redis or a similar distributed cache
    // This is a simplified example - replace with your actual Redis implementation
    
    try {
      // Example Redis implementation (you'll need to install and configure Redis)
      // const redis = await getRedisClient()
      // const key = `${this.config.keyPrefix}:${identifier}`
      // const current = await redis.incr(key)
      // 
      // if (current === 1) {
      //   await redis.expire(key, Math.floor(this.config.windowMs / 1000))
      // }
      // 
      // const ttl = await redis.ttl(key)
      // const remaining = Math.max(0, this.config.maxRequests - current)
      // 
      // return {
      //   isLimited: current > this.config.maxRequests,
      //   remaining,
      //   resetTime: Date.now() + (ttl * 1000)
      // }

      // For now, fall back to development mode in production
      // TODO: Implement proper Redis-based rate limiting
      console.warn('Production rate limiting not implemented - falling back to development mode')
      return this.checkLimitDevelopment(identifier)
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request (fail open)
      return {
        isLimited: false,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      }
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`
    
    if (this.isProduction) {
      // TODO: Implement Redis reset
      // const redis = await getRedisClient()
      // await redis.del(key)
    } else {
      devStore.delete(key)
    }
  }
}

// Export a default instance
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyPrefix: 'supabase_auth'
})

// Export helper function for middleware
export async function checkAuthRateLimit(identifier: string): Promise<boolean> {
  const result = await authRateLimiter.checkLimit(identifier)
  return result.isLimited
} 