import { randomInt } from 'crypto';

// Your AccountSID and Auth Token from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Track if we've already warned about configuration
let configWarningLogged = false;

// Improved Twilio client initialization
let client: any = null;
let twilioInitialized = false;

// Lazy initialization of Twilio to prevent startup issues
function initTwilio() {
  if (twilioInitialized) return;
  
  twilioInitialized = true;
  
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    if (!configWarningLogged) {
      console.error('Missing Twilio configuration. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file.');
      configWarningLogged = true;
    }
    return false;
  }
  
  try {
    const twilio = require('twilio');
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return false;
  }
}

// Function to generate a random 6-digit code
export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

// Function to check phone number format and normalize it
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Make sure it has proper international format
  if (digitsOnly.length === 10) {
    // US number without country code, add +1
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length > 10 && !phoneNumber.startsWith('+')) {
    // Add + prefix if it doesn't have one
    return `+${digitsOnly}`;
  }
  
  // Return original format if it already has + or other cases
  return phoneNumber;
}

// Function to send verification code via SMS
export async function sendVerificationSMS(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  // Initialize Twilio if needed
  if (!initTwilio()) {
    return false;
  }
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio is not configured properly - client:', !!client, 'phone:', !!twilioPhoneNumber);
    return false;
  }

  try {
    const message = await client.messages.create({
      body: `Your verification code is: ${code}`,
      from: twilioPhoneNumber,
      to: normalizedPhone,
    });

    console.log(`Verification code sent to ${normalizedPhone}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('Error sending verification SMS:', error);
    // Log more specific details about Twilio errors
    if (error.code) {
      console.error(`Twilio error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`Twilio error message: ${error.message}`);
    }
    if (error.moreInfo) {
      console.error(`Twilio more info: ${error.moreInfo}`);
    }
    return false;
  }
}

// Function to send 2FA login code
export async function send2FACode(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  // Initialize Twilio if needed
  if (!initTwilio()) {
    return false;
  }
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio is not configured properly - client:', !!client, 'phone:', !!twilioPhoneNumber);
    return false;
  }

  try {
    const message = await client.messages.create({
      body: `Your login verification code is: ${code}. It will expire in 10 minutes.`,
      from: twilioPhoneNumber,
      to: normalizedPhone,
    });

    console.log(`2FA code sent to ${normalizedPhone}, SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('Error sending 2FA SMS:', error);
    // Log more specific details about Twilio errors
    if (error.code) {
      console.error(`Twilio error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`Twilio error message: ${error.message}`);
    }
    if (error.moreInfo) {
      console.error(`Twilio more info: ${error.moreInfo}`);
    }
    return false;
  }
} 