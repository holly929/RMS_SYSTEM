import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { amount, email, billId } = await request.json();

  // In a real app, you would call the Paystack API here to create a transaction
  // For this simulation, we'll just generate a mock authorization URL

  const mockAuthUrl = `/payment/callback?status=success&reference=${Date.now()}&billId=${billId}&amount=${amount}`;

  return NextResponse.json({ authorization_url: mockAuthUrl });
}
