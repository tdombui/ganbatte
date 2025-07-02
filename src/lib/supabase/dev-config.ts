/**
 * Development configuration for Supabase
 * This file contains settings to help with rate limiting and debugging in development
 */

export const DEV_CONFIG = {
  // Rate limiting settings
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 10,
    RETRY_DELAY_MS: 1000,
    MAX_RETRIES: 3,
  },
  
  // Auth settings
  AUTH: {
    SESSION_REFRESH_INTERVAL_MS: 10 * 60 * 1000, // 10 minutes
    AUTH_TIMEOUT_MS: 8000, // 8 seconds
  },
  
  // Debug settings
  DEBUG: {
    LOG_AUTH_STATE_CHANGES: true,
    LOG_RATE_LIMITS: true,
    LOG_SESSION_REFRESH: true,
  }
}

// Helper function to check if we're in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Helper function to add delay with exponential backoff
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper function to retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEV_CONFIG.RATE_LIMIT.MAX_RETRIES,
  baseDelay: number = DEV_CONFIG.RATE_LIMIT.RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on auth errors that aren't rate limiting
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('invalid') || 
            errorMessage.includes('expired') || 
            errorMessage.includes('token') ||
            errorMessage.includes('unauthorized')) {
          throw error
        }
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Calculate delay with exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt)
      console.log(`Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
      await delay(delayMs)
    }
  }
  
  throw lastError!
} 