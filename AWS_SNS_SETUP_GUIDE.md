# AWS SNS SMS Integration Setup Guide

## Overview
This guide will help you set up AWS SNS (Simple Notification Service) for SMS messaging, replacing Twilio with a simpler, more reliable solution.

## Why AWS SNS?

### ✅ **Advantages:**
- **Simpler setup** - No complex verification processes
- **Pay-per-use** - Only pay for messages sent
- **AWS integration** - Works seamlessly with your existing AWS setup
- **Reliable delivery** - AWS infrastructure
- **No toll-free verification** - Regular SMS without complex compliance

### ⚠️ **Limitations:**
- **No SMS receiving** - Can only send SMS (not receive)
- **No toll-free numbers** - Uses regular phone numbers
- **Limited to SMS** - No voice or MMS capabilities

## Step 1: AWS Setup

### 1.1 Create AWS Account (if you don't have one)
1. Go to [AWS Console](https://aws.amazon.com/)
2. Create an account or sign in
3. Set up billing (SNS is pay-per-use, very cheap)

### 1.2 Create IAM User for SMS
1. Go to IAM Console → Users → Create User
2. Name: `ganbatte-sms-user`
3. Select "Programmatic access"
4. Attach policy: `AmazonSNSFullAccess` (or create custom policy)
5. Save the Access Key ID and Secret Access Key

### 1.3 Enable SMS in SNS
1. Go to SNS Console → Text messaging (SMS)
2. Click "Get started with SMS"
3. Set default SMS type to "Transactional"
4. Set spending limit (recommend $10-50/month)

## Step 2: Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# AWS SNS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1  # or your preferred region
```

## Step 3: Test the Integration

### 3.1 Test Page
Visit: `https://your-domain.vercel.app/test/sms`

### 3.2 Test API
```bash
curl -X POST https://your-domain.vercel.app/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "testType": "delivery_update"
  }'
```

## Step 4: Integration with Your App

### 4.1 Replace Twilio Calls
Replace Twilio SMS calls with AWS SNS:

```typescript
// Old Twilio code
import twilio from 'twilio'
const client = twilio(accountSid, authToken)
await client.messages.create({
  body: message,
  to: phoneNumber,
  from: twilioNumber
})

// New AWS SNS code
import { sendSMS } from '@/lib/aws-sns'
await sendSMS({ phoneNumber, message })
```

### 4.2 Update Job Creation
In your job creation API, add SMS confirmation:

```typescript
import { sendJobConfirmation } from '@/lib/aws-sns'

// After job is created
await sendJobConfirmation(
  customerPhone,
  jobId,
  pickupAddress,
  dropoffAddress
)
```

### 4.3 Update Delivery Status
In your delivery update API:

```typescript
import { sendDeliveryUpdate } from '@/lib/aws-sns'

// When delivery status changes
await sendDeliveryUpdate(
  customerPhone,
  jobId,
  'In Transit',
  '2:30 PM'
)
```

## Step 5: SMS Receiving (Alternative Solutions)

Since AWS SNS can't receive SMS, here are alternatives:

### Option A: Web Form + SMS Updates
- Customers use web form to create jobs
- You send SMS updates about delivery status
- Simple and effective

### Option B: Email + SMS Updates
- Customers email you job requests
- You send SMS updates about delivery status
- Good for business customers

### Option C: Phone Call + SMS Updates
- Customers call you to create jobs
- You send SMS updates about delivery status
- Traditional but effective

### Option D: Third-party SMS Receiving
- Use a service like [ngrok](https://ngrok.com/) for development
- Use [AWS Connect](https://aws.amazon.com/connect/) for production
- More complex but provides full SMS functionality

## Step 6: Cost Analysis

### AWS SNS Pricing (US):
- **SMS**: $0.00645 per message (US)
- **Monthly cost for 1000 messages**: ~$6.45
- **No monthly fees or setup costs**

### Comparison with Twilio:
- **Twilio**: $0.0079 per message + monthly fees
- **AWS SNS**: $0.00645 per message, no monthly fees
- **Savings**: ~18% cheaper + no verification hassle

## Step 7: Production Deployment

### 7.1 Environment Variables
Add to Vercel:
```bash
AWS_ACCESS_KEY_ID=your_production_key
AWS_SECRET_ACCESS_KEY=your_production_secret
AWS_REGION=us-east-1
```

### 7.2 Monitoring
- Set up AWS CloudWatch alerts for SMS spending
- Monitor delivery success rates
- Track message costs

### 7.3 Security
- Use IAM roles instead of access keys in production
- Set up spending limits
- Monitor usage regularly

## Migration Checklist

- [ ] Set up AWS account and IAM user
- [ ] Configure environment variables
- [ ] Test SMS sending functionality
- [ ] Update job creation to send SMS confirmations
- [ ] Update delivery status to send SMS updates
- [ ] Remove Twilio dependencies
- [ ] Deploy to production
- [ ] Monitor costs and delivery rates

## Troubleshooting

### Common Issues:

1. **"Invalid phone number"**
   - Ensure phone number is in E.164 format (+1234567890)
   - Check for extra spaces or characters

2. **"Access denied"**
   - Verify AWS credentials are correct
   - Check IAM permissions for SNS

3. **"Spending limit exceeded"**
   - Increase spending limit in SNS console
   - Check for message loops

4. **"Message not delivered"**
   - Check phone number format
   - Verify AWS region settings
   - Check SNS console for delivery status

## Next Steps

1. **Test the integration** with your phone number
2. **Update your job creation flow** to send SMS confirmations
3. **Update your delivery tracking** to send SMS updates
4. **Remove Twilio code** once everything is working
5. **Monitor costs** and adjust as needed

This setup gives you reliable SMS sending without the complexity of Twilio's verification process! 