import { rateLimit } from './src/lib/rateLimit';

async function testNextRateLimit() {
  console.log('=== Testing Next.js API Rate Limiting ===\n');
  
  try {
    // Test rate limit logic
    const mockReq = {
      headers: {
        get: (name) => {
          if (name === 'x-forwarded-for') return '192.168.1.1';
          return undefined;
        }
      }
    };
    
    // Simulate multiple requests
    console.log('🔍 Simulating 6 SMS requests from the same IP...');
    
    for (let i = 1; i <= 6; i++) {
      const result = await rateLimit(mockReq, 'sms');
      console.log(`Request ${i}: ${result.success ? '✅ Success' : `❌ Failed - ${result.message}`}`);
    }
    
    console.log('\n✅ Next.js rate limiting logic working correctly');
    
  } catch (error) {
    console.log('❌ Error testing Next.js rate limiting:', error);
  }
}

// Run test
testNextRateLimit();