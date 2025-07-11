# Twilio SMS Integration Setup Guide

## Overview
This guide will help you set up Twilio SMS integration so customers can text your phone number and get AI-powered responses, including automatic job creation.

## Prerequisites
- Twilio account (sign up at https://www.twilio.com)
- Phone number from Twilio
- OpenAI API key
- Supabase project with service role key

## Step 1: Database Setup

### Run the Migration
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration from `supabase/migrations/005_create_twilio_customers.sql`

This will create:
- `twilio_customers` table for SMS customers
- `created_via` column in `jobs` table
- Proper RLS policies

## Step 2: Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# Twilio (you'll get these from Twilio dashboard)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# OpenAI (you already have this)
OPENAI_API_KEY=your_openai_key

# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Twilio Configuration

### 1. Get Twilio Credentials
1. Log into your Twilio Console
2. Go to Dashboard → Account Info
3. Copy your Account SID and Auth Token

### 2. Get a Phone Number
1. Go to Phone Numbers → Manage → Buy a number
2. Choose a number in your target area
3. Note the phone number (format: +1XXXXXXXXXX)

### 3. Configure Webhook
1. Go to Phone Numbers → Manage → Active numbers
2. Click on your number
3. In "Messaging" section, set:
   - **Webhook URL**: `https://your-domain.vercel.app/api/twilio/webhook`
   - **HTTP Method**: POST
4. Save configuration

## Step 4: Deploy Your App

Deploy to Vercel with the new environment variables:

```bash
git add .
git commit -m "Add Twilio SMS integration"
git push
```

## Step 5: Test the Integration

### Test with a Real Phone
1. Text your Twilio number: "Hi, I need a delivery"
2. The AI should respond asking for pickup/dropoff addresses
3. Reply with: "Pickup from 123 Main St, dropoff at 456 Oak Ave"
4. The AI should create a job and confirm

### Test Job Creation
1. Text: "I need to send a package from 789 Pine St to 321 Elm St"
2. The AI should automatically create a job and respond with job details

## Step 6: Monitor and Manage

### View SMS Customers
- Go to `/admin/twilio` in your app
- View all SMS customers and their interaction history

### Check Logs
- Monitor Vercel logs for webhook activity
- Look for console logs starting with 📱 and 🤖

## How It Works

### 1. Customer Flow
1. Customer texts your Twilio number
2. Webhook receives the message
3. AI processes the message and responds
4. If job details are provided, automatically creates a job
5. Customer gets confirmation with job ID

### 2. AI Processing
- Uses GPT-4o-mini for natural language understanding
- Detects job creation intent
- Extracts pickup/dropoff addresses
- Creates jobs in your existing system

### 3. Customer Management
- Automatically creates customer records
- Tracks interaction history
- Links SMS customers to jobs

## Advanced Features

### Conversation Context (Future Enhancement)
You can enhance the system by:
1. Adding a `conversation_context` column to `twilio_customers`
2. Storing conversation history for better context
3. Implementing multi-turn job creation flows

### Job Status Updates
You can add SMS notifications for:
- Driver assigned
- Pickup completed
- Delivery completed
- Job status changes

### Customer Onboarding
Enhance the first interaction to:
- Ask for customer name
- Collect email (optional)
- Explain service capabilities

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check Twilio webhook URL is correct
   - Verify HTTPS (not HTTP)
   - Check Vercel deployment is live

2. **AI not responding**
   - Check OpenAI API key
   - Verify environment variables
   - Check Vercel logs for errors

3. **Jobs not creating**
   - Check Supabase service role key
   - Verify database migration ran
   - Check for RLS policy issues

4. **Phone number format issues**
   - Twilio sends numbers with +1 prefix
   - Code strips +1 for storage
   - Ensure consistent formatting

### Debug Endpoints
- `/api/test/twilio-webhook` - Test webhook processing
- `/api/test/twilio-customers` - Test customer creation

## Security Considerations

1. **Webhook Validation**
   - Twilio sends signature headers for validation
   - Consider implementing signature verification

2. **Rate Limiting**
   - Implement rate limiting per phone number
   - Prevent spam/abuse

3. **Data Privacy**
   - Phone numbers are PII
   - Ensure proper data handling
   - Consider GDPR compliance

## Cost Considerations

### Twilio Costs
- Phone number: ~$1/month
- SMS: ~$0.0075 per message (US)
- Webhook calls: Free

### OpenAI Costs
- GPT-4o-mini: ~$0.00015 per 1K tokens
- Typical conversation: ~100-200 tokens
- Very cost-effective for SMS

## Next Steps

1. **Deploy and test** the basic integration
2. **Monitor usage** and customer feedback
3. **Enhance AI prompts** based on real conversations
4. **Add job status notifications**
5. **Implement conversation context**
6. **Add customer onboarding flow**

## Support

If you encounter issues:
1. Check Vercel logs for errors
2. Verify all environment variables
3. Test webhook endpoint manually
4. Check Twilio console for message delivery status

The integration is designed to be robust and handle edge cases gracefully. The AI will always respond, even if job creation fails. 