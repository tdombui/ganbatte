import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, sendDeliveryUpdate, sendJobConfirmation } from '@/lib/aws-sns'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, testType } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    let result

    switch (testType) {
      case 'delivery_update':
        result = await sendDeliveryUpdate(phoneNumber, 'TEST123', 'In Transit', '2:30 PM')
        break
      case 'job_confirmation':
        result = await sendJobConfirmation(
          phoneNumber, 
          'TEST123', 
          '123 Main St, Los Angeles, CA', 
          '456 Oak Ave, San Diego, CA'
        )
        break
      case 'custom':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required for custom test' },
            { status: 400 }
          )
        }
        result = await sendSMS({ phoneNumber, message })
        break
      default:
        result = await sendSMS({ 
          phoneNumber, 
          message: message || 'Test message from GanbattePM AWS SNS integration!' 
        })
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ SMS test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'SMS test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SMS Test API',
    availableTests: [
      'delivery_update',
      'job_confirmation', 
      'custom'
    ],
    usage: {
      POST: {
        phoneNumber: 'Required: Phone number to send SMS to',
        message: 'Optional: Custom message (for custom test)',
        testType: 'Optional: Type of test to run'
      }
    }
  })
} 