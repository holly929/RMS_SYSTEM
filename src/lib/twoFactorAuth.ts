import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export type TwoFactorSetup = {
  secret: string;
  qrCode: string;
  recoveryCodes: string[];
};

export type TwoFactorVerifyResult = {
  success: boolean;
  message: string;
};

export function generateTwoFactorSecret(email: string): TwoFactorSetup {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `RateEase (${email})`
  });

  const recoveryCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    recoveryCodes.push(
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
  }

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url,
    recoveryCodes
  };
}

export function verifyTwoFactorCode(
  secret: string,
  code: string
): TwoFactorVerifyResult {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 2
  });

  if (!verified) {
    return {
      success: false,
      message: 'Invalid verification code'
    };
  }

  return {
    success: true,
    message: 'Verification successful'
  };
}

export async function generateQRCode(url: string): Promise<string> {
  try {
    return await qrcode.toDataURL(url);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function verifyRecoveryCode(
  recoveryCodes: string[] | undefined,
  code: string
): { success: boolean; remainingCodes: string[] } {
  if (!recoveryCodes || recoveryCodes.length === 0) {
    return {
      success: false,
      remainingCodes: []
    };
  }

  const normalizedCode = code.trim().toUpperCase();
  const codeIndex = recoveryCodes.findIndex(
    rc => rc.trim().toUpperCase() === normalizedCode
  );

  if (codeIndex === -1) {
    return {
      success: false,
      remainingCodes: [...recoveryCodes]
    };
  }

  const remainingCodes = [...recoveryCodes];
  remainingCodes.splice(codeIndex, 1);

  return {
    success: true,
    remainingCodes
  };
}
