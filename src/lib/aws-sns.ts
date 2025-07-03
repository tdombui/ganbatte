import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

// Initialize SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export interface SMSMessage {
  phoneNumber: string
  message: string
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS message using AWS SNS
 */
export async function sendSMS({ phoneNumber, message }: SMSMessage): Promise<SMSResponse> {
  try {
    // Format phone number for AWS SNS (must be E.164 format)
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: formattedPhone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // Use 'Promotional' for marketing messages
        },
      },
    })

    const response = await snsClient.send(command)
    
    console.log('📱 SMS sent successfully:', {
      phoneNumber: formattedPhone,
      messageId: response.MessageId,
      messageLength: message.length,
    })

    return {
      success: true,
      messageId: response.MessageId,
    }
  } catch (error) {
    console.error('❌ SMS send failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send multiple SMS messages
 */
export async function sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
  const results = await Promise.allSettled(
    messages.map(message => sendSMS(message))
  )
  
  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : { success: false, error: 'Promise rejected' }
  )
}

/**
 * Format phone number to E.164 format for AWS SNS
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '')
  
  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If it already has country code, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // If it's already in E.164 format, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }
  
  // Default: assume US number and add +1
  return `+1${digits}`
}

/**
 * Send delivery update to customer
 */
export async function sendDeliveryUpdate(
  phoneNumber: string, 
  jobId: string, 
  status: string, 
  estimatedTime?: string
): Promise<SMSResponse> {
  const message = `🚚 GanbattePM Update: Your delivery (Job #${jobId}) is ${status.toLowerCase()}. ${
    estimatedTime ? `Estimated arrival: ${estimatedTime}` : ''
  }`.trim()
  
  return sendSMS({ phoneNumber, message })
}

/**
 * Send job creation confirmation
 */
export async function sendJobConfirmation(
  phoneNumber: string, 
  jobId: string, 
  pickupAddress: string, 
  dropoffAddress: string
): Promise<SMSResponse> {
  const message = `✅ Job Created! Job #${jobId} from ${pickupAddress} to ${dropoffAddress}. We'll keep you updated on your delivery status. Reply STOP to opt out.`
  
  return sendSMS({ phoneNumber, message })
}

/**
 * Send consent request message
 */
export async function sendConsentRequest(phoneNumber: string): Promise<SMSResponse> {
  const message = `Welcome to GanbattePM! 🚚 We deliver mission-critical payloads across Southern California. To help you, we need your consent to send SMS updates about your deliveries. Reply YES to continue or STOP to opt out. Standard messaging rates apply.`
  
  return sendSMS({ phoneNumber, message })
}

/**
 * Send consent confirmation
 */
export async function sendConsentConfirmation(phoneNumber: string): Promise<SMSResponse> {
  const message = `Thank you! You're now opted in to receive delivery updates via SMS. Reply STOP anytime to opt out. What do you need delivered today?`
  
  return sendSMS({ phoneNumber, message })
}

/**
 * Send opt-out confirmation
 */
export async function sendOptOutConfirmation(phoneNumber: string): Promise<SMSResponse> {
  const message = `You have been unsubscribed from GanbattePM SMS updates. You will no longer receive delivery notifications. Text us again if you need delivery services.`
  
  return sendSMS({ phoneNumber, message })
}

/**
 * Send staff notification
 */
export async function sendStaffNotification(
  phoneNumber: string, 
  message: string
): Promise<SMSResponse> {
  const staffMessage = `🔔 Staff Alert: ${message}`
  
  return sendSMS({ phoneNumber, message: staffMessage })
} 