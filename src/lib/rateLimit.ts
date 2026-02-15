import { RateLimiter } from 'limiter';

// In-memory storage for rate limiting (for development/testing)
// In production, consider using Redis or a database
const rateLimiters = new Map<string, RateLimiter>();

// Rate limiting configuration
const RATE_LIMITS = {
  sms: {
    max: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many SMS requests, please try again after 1 hour'
  },
  payment: {
    max: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many payment requests, please try again after 15 minutes'
  },
  general: {
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests, please try again after 15 minutes'
  }
};

// Get or create a rate limiter for a specific key and type
function getRateLimiter(key: string, type: keyof typeof RATE_LIMITS = 'general'): RateLimiter {
  const limiterKey = `${type}:${key}`;
  if (!rateLimiters.has(limiterKey)) {
    const config = RATE_LIMITS[type];
    rateLimiters.set(limiterKey, new RateLimiter({
      tokensPerInterval: config.max,
      interval: config.windowMs,
      fireImmediately: true
    }));
  }
  return rateLimiters.get(limiterKey)!;
}

// Rate limiting handler for Next.js API routes
export async function rateLimit(
  req: Request,
  type: keyof typeof RATE_LIMITS = 'general'
): Promise<{ success: boolean; message?: string; retryAfter?: number }> {
  try {
    // Get IP address from request (simplified - in production, check for proxies)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    const limiter = getRateLimiter(ip, type);
    const remainingTokens = await limiter.removeTokens(1);
    
    if (remainingTokens < 0) {
      const config = RATE_LIMITS[type];
      return {
        success: false,
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      };
    }
    
    return {
      success: true,
      retryAfter: 0
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fallback - allow request if rate limiting fails
    return {
      success: true,
      retryAfter: 0
    };
  }
}

// Middleware wrapper for Next.js API routes
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  type: keyof typeof RATE_LIMITS = 'general'
) {
  return async (req: Request) => {
    const result = await rateLimit(req, type);
    if (!result.success) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (result.retryAfter) {
        headers['Retry-After'] = result.retryAfter.toString();
      }
      
      return new Response(JSON.stringify({
        error: result.message
      }), {
        status: 429,
        headers
      });
    }
    
    return handler(req);
  };
}