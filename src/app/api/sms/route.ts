import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimit';
import { normalizePhoneNumber } from '@/lib/phone-utils';

async function handler(request: Request) {
  const body = await request.json();
  const { phoneNumber, message, apiKey, senderId, recipients, batch } = body;

  if (!batch && (!message || (!phoneNumber && !recipients))) {
    return NextResponse.json({ error: 'Message and recipients are required.' }, { status: 400 });
  }

  const { ARKESEL_API_KEY, ARKESEL_SENDER_ID } = process.env;

  const finalApiKey = apiKey || ARKESEL_API_KEY;
  const finalSenderId = senderId || ARKESEL_SENDER_ID;

  if (!finalApiKey || !finalSenderId) {
    return NextResponse.json({ 
      error: 'SMS service is not configured. Please enter your API Key and Sender ID in the Settings page.' 
    }, { status: 400 });
  }

  // Using Arkesel v2 JSON API for improved performance and reliability
  const arkeselUrl = 'https://sms.arkesel.com/api/v2/sms/send';

  // Case 1: Personalized Batch (Multiple unique messages processed on server)
  if (batch && Array.isArray(batch)) {
    const results = await Promise.all(batch.map(async (task) => {
      const normalized = normalizePhoneNumber(task.to);
      if (!normalized) return { success: false, error: 'Invalid phone', to: task.to };

      try {
        const response = await fetch(arkeselUrl, {
          method: 'POST',
          headers: {
            'api-key': finalApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            sender: finalSenderId,
            message: task.message,
            recipients: [normalized],
          }),
        });
        const data = await response.json();
        return { 
          success: response.ok && (data.status === 'success' || data.code === 1000), 
          to: normalized,
          error: response.ok ? undefined : data.message 
        };
      } catch (error) {
        return { success: false, error: 'Connection failure', to: normalized };
      }
    }));

    return NextResponse.json({ success: true, results });
  }

  // Case 2: Bulk SMS (Same message to many recipients - Arkesel optimized)
  const recipientList = Array.isArray(recipients) ? recipients : (phoneNumber ? [phoneNumber] : []);
  const normalizedRecipients = recipientList
    .map(phone => normalizePhoneNumber(phone))
    .filter(Boolean);

  if (normalizedRecipients.length === 0) {
    return NextResponse.json({ error: 'No valid phone numbers provided.' }, { status: 400 });
  }

  try {
    const response = await fetch(arkeselUrl, {
      method: 'POST',
      headers: {
        'api-key': finalApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: finalSenderId,
        message: message,
        recipients: normalizedRecipients,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Arkesel v2 success status check
      if (data.status === 'success' || data.code === 1000) {
        return NextResponse.json({ success: true, balance: data.balance });
      }
      
      return NextResponse.json({ 
        error: `Arkesel API error: ${data.message || 'The message could not be sent.'}` 
      }, { status: 400 });
    } else {
      return NextResponse.json({ 
        error: `Arkesel service error: ${data.message || response.statusText}` 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('SMS API connectivity error:', error);
    return NextResponse.json({ error: 'Failed to connect to SMS service.' }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, 'sms');
