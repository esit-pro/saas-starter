import { randomInt } from 'crypto';

// Your AccountSID and Auth Token from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = accountSid && authToken ? require('twilio')(accountSid, authToken) : null;

// Function to generate a random 6-digit code
export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

// Function to send verification code via SMS
export async function sendVerificationSMS(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio is not configured properly');
    return false;
  }

  try {
    const message = await client.messages.create({
      body: `Your verification code is: ${code}`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`Verification code sent to ${phoneNumber}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending verification SMS:', error);
    return false;
  }
}

// Function to send 2FA login code
export async function send2FACode(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio is not configured properly');
    return false;
  }

  try {
    const message = await client.messages.create({
      body: `Your login verification code is: ${code}. It will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`2FA code sent to ${phoneNumber}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending 2FA SMS:', error);
    return false;
  }
} 