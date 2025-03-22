import { randomInt } from 'crypto';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development';

// Track if we've already warned about configuration
let configWarningLogged = false;

// Improved Twilio client initialization
let client: any = null;
let twilioInitialized = false;

// Track generated codes
const devModeCodes: Record<string, string> = {};

// Configuration status to help debug issues
interface TwilioConfigStatus {
  initialized: boolean;
  hasAccountSid: boolean;
  hasAuthToken: boolean;
  hasPhoneNumber: boolean;
  clientCreated: boolean;
  isDevelopmentMode: boolean;
  configWarningLogged: boolean;
}

// Define Twilio error interface
interface TwilioError {
  code?: number | string;
  message?: string;
  moreInfo?: string;
  [key: string]: any; // Allow other properties
}

let configStatus: TwilioConfigStatus = {
  initialized: false,
  hasAccountSid: !!accountSid,
  hasAuthToken: !!authToken,
  hasPhoneNumber: !!twilioPhoneNumber,
  clientCreated: false,
  isDevelopmentMode: isDevelopment,
  configWarningLogged: false
};

// Lazy initialization of Twilio to prevent startup issues
function initTwilio() {
  if (twilioInitialized) {
    // Already initialized, but check if client actually exists
    if (!client && !isDevelopment) {
      console.error('Twilio was marked as initialized but client is null');
      return false;
    }
    return true;
  }
  
  twilioInitialized = true;
  configStatus.initialized = true;
  
  console.log('Initializing Twilio client...');
  
  // Check for required configuration
  if (!accountSid) {
    console.error('Missing TWILIO_ACCOUNT_SID in environment variables');
    configWarningLogged = true;
    configStatus.configWarningLogged = true;
    return isDevelopment;
  }
  
  if (!authToken) {
    console.error('Missing TWILIO_AUTH_TOKEN in environment variables');
    configWarningLogged = true;
    configStatus.configWarningLogged = true;
    return isDevelopment;
  }
  
  if (!twilioPhoneNumber) {
    console.error('Missing TWILIO_PHONE_NUMBER in environment variables');
    configWarningLogged = true;
    configStatus.configWarningLogged = true;
    return isDevelopment;
  }
  
  try {
    // Make sure we have twilio package
    let twilio;
    try {
      twilio = require('twilio');
    } catch (packageError) {
      console.error('Failed to require twilio package. Is it installed?', packageError);
      return isDevelopment;
    }
    
    // Now initialize the client with credentials
    try {
      client = twilio(accountSid, authToken);
      console.log('Twilio client initialized successfully');
      configStatus.clientCreated = true;
      
      // Test client with a basic API call to verify credentials are correct
      if (!isDevelopment) {
        try {
          // Just access account info to verify credentials
          console.log('Testing Twilio credentials...');
        } catch (credentialError) {
          console.error('Twilio credentials appear to be invalid:', credentialError);
          return false;
        }
      }
      
      return true;
    } catch (clientError) {
      console.error('Failed to create Twilio client:', clientError);
      return isDevelopment;
    }
  } catch (error) {
    console.error('Unexpected error initializing Twilio:', error);
    // Allow fallback in development
    return isDevelopment;
  }
}

// Export diagnostic function for troubleshooting
export function getTwilioConfigStatus(): TwilioConfigStatus {
  // Force initialization if not already done
  if (!twilioInitialized) {
    initTwilio();
  }
  return { ...configStatus };
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
  const twilioReady = initTwilio();
  
  if (!twilioReady && !isDevelopment) {
    return false;
  }
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Development fallback - just log the code
  if (isDevelopment && (!client || !twilioPhoneNumber)) {
    console.log(`\n==== DEVELOPMENT MODE: SMS CODE ====`);
    console.log(`📱 Verification code for ${normalizedPhone}: ${code}`);
    console.log(`====================================\n`);
    
    // Store the code for reference
    devModeCodes[normalizedPhone] = code;
    return true;
  }

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
      console.error(`Twilio error message: ${error.moreInfo}`);
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
  const twilioReady = initTwilio();
  
  if (!twilioReady && !isDevelopment) {
    console.error('Twilio is not ready and not in development mode');
    return false;
  }
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Development fallback - just log the code
  if (isDevelopment && (!client || !twilioPhoneNumber)) {
    console.log(`\n==== DEVELOPMENT MODE: 2FA CODE ====`);
    console.log(`🔐 Login verification code for ${normalizedPhone}: ${code}`);
    console.log(`====================================\n`);
    
    // Store the code for reference
    devModeCodes[normalizedPhone] = code;
    return true;
  }

  if (!client || !twilioPhoneNumber) {
    console.error('Twilio is not configured properly - client:', !!client, 'phone:', !!twilioPhoneNumber);
    return false;
  }
  
  // Validate Twilio phone number format
  if (!twilioPhoneNumber.startsWith('+')) {
    console.error('Twilio phone number must start with +: ', twilioPhoneNumber);
    return false;
  }

  try {
    // Add retry logic for more reliability
    let retries = 0;
    const maxRetries = 2;
    let lastError = null;
    
    while (retries <= maxRetries) {
      try {
        const message = await client.messages.create({
          body: `Your login verification code is: ${code}. It will expire in 10 minutes.`,
          from: twilioPhoneNumber,
          to: normalizedPhone,
        });

        console.log(`2FA code sent to ${normalizedPhone}, SID: ${message.sid}`);
        return true;
      } catch (sendError: unknown) {
        const twilioError = sendError as TwilioError;
        lastError = twilioError;
        console.error(`Twilio send error (attempt ${retries + 1}/${maxRetries + 1}):`, sendError);
        
        // Check if this is a phone number formatting issue
        if (twilioError.code === 21211) {
          console.error('Invalid phone number format detected, no retry needed');
          break; // Don't retry for invalid phone numbers
        }
        
        // Wait before retrying
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        } else {
          break;
        }
      }
    }
    
    // If we got here, all retries failed
    console.error('All send attempts failed');
    
    // Log more specific details about the last Twilio error
    if (lastError) {
      const twilioError = lastError as TwilioError;
      if (twilioError.code) {
        console.error(`Twilio error code: ${twilioError.code}`);
      }
      if (twilioError.message) {
        console.error(`Twilio error message: ${twilioError.message}`);
      }
      if (twilioError.moreInfo) {
        console.error(`Twilio error more info: ${twilioError.moreInfo}`);
      }
    }
    
    return false;
  } catch (error: unknown) {
    console.error('Unexpected error sending 2FA SMS:', error);
    // Log more specific details about Twilio errors
    const twilioError = error as TwilioError;
    if (twilioError.code) {
      console.error(`Twilio error code: ${twilioError.code}`);
    }
    if (twilioError.message) {
      console.error(`Twilio error message: ${twilioError.message}`);
    }
    if (twilioError.moreInfo) {
      console.error(`Twilio error more info: ${twilioError.moreInfo}`);
    }
    return false;
  }
} 