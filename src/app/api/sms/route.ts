import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimit';

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = String(phone || '').replace(/\D/g, '');
  
  // Ghanaian phone number formats:
  // - Format 1: 02xxxxxxxxx (10 digits, starts with 0)
  // - Format 2: 2332xxxxxxxxx (12 digits, starts with 233)
  // - Format 3: +2332xxxxxxxxx (with leading +)
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Replace leading '0' with '233' for Ghanaian numbers (e.g., 024... -> 23324...)
    return '233' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    // Already in correct format
    return cleaned;
  }
  
  // Handle other possible Ghanaian formats
  if (cleaned.length === 9 && (cleaned.startsWith('2') || cleaned.startsWith('5'))) {
    // If we have 9 digits starting with 2 or 5, add country code
    return '233' + cleaned;
  }
  
  // For debugging purposes, log the phone number format
  if (cleaned.length < 9 || cleaned.length > 12) {
    console.warn('Invalid Ghanaian phone number format:', phone);
  }
  
  return cleaned;
}


async function handler(request: Request) {
  const { phoneNumber, message } = await request.json();

  if (!phoneNumber || !message) {
    return NextResponse.json({ error: 'Phone number and message are required.' }, { status: 400 });
  }

  // Try to get from process.env
  let { ARKESEL_API_KEY, ARKESEL_SENDER_ID } = process.env;
  
  // Debug: Log environment variables (masked)
  console.log('SMS API Environment Variables (from process.env):');
  console.log('ARKESEL_API_KEY exists:', !!ARKESEL_API_KEY);
  console.log('ARKESEL_API_KEY length:', ARKESEL_API_KEY ? ARKESEL_API_KEY.length : 0);
  console.log('ARKESEL_SENDER_ID exists:', !!ARKESEL_SENDER_ID);
  console.log('ARKESEL_SENDER_ID value:', ARKESEL_SENDER_ID);

  // Fallback to hardcoded values if environment variables not found (for debugging)
  if (!ARKESEL_API_KEY) {
    console.log('Using fallback ARKESEL_API_KEY');
    ARKESEL_API_KEY = 'RkpIc0xJb2djck9hcmtTY0RHSGI';
  }
  
  if (!ARKESEL_SENDER_ID) {
    console.log('Using fallback ARKESEL_SENDER_ID');
    ARKESEL_SENDER_ID = 'KPDARMS';
  }

  // Final validation
  if (!ARKESEL_API_KEY || !ARKESEL_SENDER_ID) {
    return NextResponse.json({ 
      error: 'SMS service is not configured on the server. Please check .env.local file.',
      details: {
        apiKeyExists: !!ARKESEL_API_KEY,
        senderIdExists: !!ARKESEL_SENDER_ID,
        nodeEnv: process.env.NODE_ENV,
        fallbackUsed: process.env.ARKESEL_API_KEY ? false : true
      }
    }, { status: 500 });
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  
  if (!normalizedPhoneNumber) {
    return NextResponse.json({ error: 'Invalid or empty phone number provided.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    action: 'send-sms',
    api_key: ARKESEL_API_KEY,
    to: normalizedPhoneNumber,
    from: ARKESEL_SENDER_ID,
    sms: message,
  });

  const arkeselUrl = `https://sms.arkesel.com/sms/api?${params.toString()}`;

  try {
    const response = await fetch(arkeselUrl, {
      method: 'GET', // Arkesel uses GET for this API
    });

    const responseText = await response.text();

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
          if (data.code === 'ok' && data.message === 'Successfully Sent') {
            return NextResponse.json({ success: true, balance: data.balance, user: data.user });
          } else {
            console.error('Arkesel error response:', data);
            return NextResponse.json({ error: `Arkesel error: ${data.message || 'Unknown error'}` }, { status: 400 });
          }
      } catch (e) {
         if (responseText.toLowerCase().includes('sent successfully')) {
             return NextResponse.json({ success: true });
         }
         console.error('Arkesel returned non-JSON response:', responseText);
         return NextResponse.json({ error: `Arkesel API returned an invalid response.`, details: responseText }, { status: 500 });
      }
    } else {
      console.error('Arkesel API request failed:', responseText);
      return NextResponse.json({ error: `Arkesel API request failed: ${responseText || response.statusText}` }, { status: response.status });
    }
  } catch (error: any) {
    console.error('Failed to send SMS via Arkesel:', error);
    return NextResponse.json({ error: 'Failed to connect to SMS service.' }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 'sms');
