# AWS SNS Visual Setup Guide (Updated 2025)

## **Step 1: Find the Right Service**

### **Option A: Search Method**
1. **Go to AWS Console** (https://console.aws.amazon.com/)
2. **In the search bar at the top**, type: `SNS`
3. **Click on "Simple Notification Service"** (the one with the orange icon)

### **Option B: Direct Navigation**
1. **Go to AWS Console**
2. **Click "Services"** in the top menu
3. **Scroll down to "Messaging"** section
4. **Click "Simple Notification Service"**

## **Step 2: Navigate to SMS Settings**

### **Current Interface (2025):**
1. **In the SNS console**, look at the **left sidebar**
2. **Scroll down** to find "Text messaging (SMS)" 
3. **If you don't see it**, try:
   - Click the **hamburger menu** (☰) to expand the sidebar
   - Look for "Mobile" → "Text messaging (SMS)"
   - Or search "SMS" in the SNS console search bar

### **Alternative Path:**
1. **In SNS console**, click **"Mobile"** in the left sidebar
2. **Click "Text messaging (SMS)"**

## **Step 3: Enable SMS (First Time Setup)**

### **What You Should See:**
- A page titled "Text messaging (SMS)" or "Get started with SMS"
- A button that says "Get started with SMS" or "Enable SMS"

### **If You See "Get started with SMS":**
1. **Click "Get started with SMS"**
2. **Set preferences**:
   - **Default SMS type**: Select "Transactional"
   - **Monthly spending limit**: Enter `10` (or your preferred amount)
   - **Default sender ID**: Leave blank
3. **Click "Save preferences"**

### **If You See "Text messaging (SMS)" with settings:**
1. **Look for "SMS preferences"** or "Settings"
2. **Set monthly spending limit** to `10` (or your preferred amount)
3. **Set default SMS type** to "Transactional"
4. **Save changes**

## **Step 4: Create IAM User (If You Haven't)**

### **Navigate to IAM:**
1. **Go back to AWS Console**
2. **Search for "IAM"** in the search bar
3. **Click "IAM"** (Identity and Access Management)

### **Create User:**
1. **Click "Users"** in the left sidebar
2. **Click "Create user"**
3. **User name**: `ganbatte-sms-user`
4. **Check "Programmatic access"** (for API keys)
5. **Click "Next: Permissions"**

### **Add Permissions:**
1. **Click "Attach existing policies directly"**
2. **In the search box**, type: `SNS`
3. **Find and check** `AmazonSNSFullAccess`
4. **Click "Next: Tags"** (skip tags)
5. **Click "Next: Review"**
6. **Click "Create user"**

### **Get Credentials:**
1. **Click "Download .csv"** to save your credentials
2. **IMPORTANT**: Save this file securely - you won't see the secret key again!

## **Step 5: Test Your Setup**

### **Test AWS Connection:**
Visit: `https://your-domain.vercel.app/api/test/aws-setup`

This will tell you if your AWS credentials are working.

### **Test SMS Sending:**
Visit: `https://your-domain.vercel.app/test/sms`

## **Step 6: Environment Variables**

### **Add to .env.local:**
```bash
AWS_ACCESS_KEY_ID=your_access_key_from_csv
AWS_SECRET_ACCESS_KEY=your_secret_key_from_csv
AWS_REGION=us-east-1
```

### **Add to Vercel:**
1. **Go to your Vercel project**
2. **Settings** → **Environment Variables**
3. **Add the same variables**

## **Common Issues & Solutions**

### **"Can't find SMS settings"**
- **Try**: Search "SMS" in the SNS console search bar
- **Try**: Look under "Mobile" in the left sidebar
- **Try**: Go to "Preferences" or "Settings" in SNS

### **"Access denied" errors**
- **Check**: IAM user has `AmazonSNSFullAccess` policy
- **Check**: AWS credentials are correct
- **Check**: AWS region is correct

### **"SMS not enabled"**
- **Go to**: SNS Console → Text messaging (SMS)
- **Click**: "Get started with SMS" or "Enable SMS"
- **Set**: Spending limit (required)

### **"Spending limit exceeded"**
- **Go to**: SNS Console → Text messaging (SMS)
- **Increase**: Monthly spending limit
- **Wait**: A few minutes for changes to take effect

## **What to Look For**

### **In SNS Console:**
- ✅ **Left sidebar** with "Text messaging (SMS)"
- ✅ **SMS preferences** or settings page
- ✅ **Monthly spending limit** field
- ✅ **Default SMS type** dropdown

### **In IAM Console:**
- ✅ **Users** section with your `ganbatte-sms-user`
- ✅ **Policies** attached to the user
- ✅ **Access keys** created for the user

## **Next Steps After Setup**

1. **Test AWS connection** at `/api/test/aws-setup`
2. **Test SMS sending** at `/test/sms`
3. **Integrate SMS** into your job creation flow
4. **Monitor costs** in AWS SNS console

## **Need More Help?**

If you're still having trouble:
1. **Take a screenshot** of what you see in the SNS console
2. **Note the exact error messages** you get
3. **Check the AWS region** you're using
4. **Verify your IAM user** has the right permissions

The AWS interface changes frequently, so if these steps don't match what you see, let me know what you're seeing and I'll update the guide! 