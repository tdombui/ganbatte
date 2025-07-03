import { NextResponse } from 'next/server'
import { SNSClient, ListSubscriptionsCommand } from '@aws-sdk/client-sns'

export async function GET() {
  try {
    // Check if AWS credentials are configured
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY
    const region = process.env.AWS_REGION || 'us-east-1'

    if (!hasAccessKey || !hasSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'AWS credentials not configured',
        missing: {
          accessKey: !hasAccessKey,
          secretKey: !hasSecretKey
        },
        setup: {
          accessKey: 'AWS_ACCESS_KEY_ID',
          secretKey: 'AWS_SECRET_ACCESS_KEY',
          region: 'AWS_REGION (optional)'
        }
      })
    }

    // Test AWS SNS connection
    const snsClient = new SNSClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // Try a simple SNS operation to test credentials
    const command = new ListSubscriptionsCommand({})
    await snsClient.send(command)

    return NextResponse.json({
      success: true,
      message: 'AWS SNS connection successful!',
      credentials: {
        hasAccessKey: true,
        hasSecretKey: true,
        region
      },
      nextSteps: [
        '1. Go to AWS SNS Console → Text messaging (SMS)',
        '2. Set spending limit (recommend $10-50)',
        '3. Test SMS sending at /test/sms'
      ]
    })

  } catch (error) {
    console.error('❌ AWS SNS test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'AWS SNS connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        '1. Check AWS credentials are correct',
        '2. Verify IAM user has SNS permissions',
        '3. Check AWS region is correct',
        '4. Ensure SMS is enabled in SNS console'
      ]
    })
  }
} 