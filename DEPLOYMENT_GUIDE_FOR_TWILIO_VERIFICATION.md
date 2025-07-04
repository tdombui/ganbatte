# Deployment Guide for Twilio Verification
**Date:** July 3, 2025  
**Purpose:** Make Ganbatte website publicly accessible for Twilio toll-free verification

## 🎯 **Objective**
Deploy Ganbatte to a public URL so Twilio can review the SMS compliance implementation and business website.

## 🚀 **Recommended Deployment: Vercel**

### **Why Vercel?**
- ✅ **Perfect for Next.js** - Built by the Next.js team
- ✅ **Free tier available** - No cost for basic deployment
- ✅ **Automatic deployments** - Deploys on every Git push
- ✅ **Custom domains** - Can use your own domain later
- ✅ **SSL included** - HTTPS by default

## 📋 **Pre-Deployment Checklist**

### **Environment Variables**
You'll need to set these in Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Twilio (if using)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Other services
STRIPE_SECRET_KEY=your_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### **Database Migration**
Ensure your Supabase database is ready:
- ✅ All migrations applied
- ✅ RLS policies configured
- ✅ Twilio customers table exists

## 🔧 **Deployment Steps**

### **Step 1: Prepare Your Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Twilio verification deployment"
git push origin main
```

### **Step 2: Deploy to Vercel**

#### **Option A: Via Vercel Dashboard (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your Ganbatte repository
5. Configure environment variables (see above)
6. Click "Deploy"

#### **Option B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to configure
```

### **Step 3: Configure Environment Variables**
In Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables (see checklist above)
4. Redeploy if needed

### **Step 4: Test Your Deployment**
Visit your Vercel URL (e.g., `https://ganbatte.vercel.app`) and verify:
- ✅ Homepage loads correctly
- ✅ SMS opt-in flow works
- ✅ Privacy Policy and Terms are accessible
- ✅ All functionality works as expected

## 🌐 **Alternative Deployment Options**

### **Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### **Railway**
- Connect GitHub repository
- Automatic deployment
- Good for full-stack apps

### **Render**
- Free tier available
- Good for Next.js apps
- Automatic deployments

## 📱 **What Twilio Will Review**

### **Required Pages/Features:**
1. **Homepage** - Business description and services
2. **SMS Opt-in Flow** - Compliance implementation
3. **Privacy Policy** - Accessible without login
4. **Terms of Service** - Accessible without login
5. **Contact Information** - Clear business details

### **SMS Compliance Features:**
- ✅ Explicit consent checkbox
- ✅ Clear opt-in process
- ✅ Message rate disclosure
- ✅ STOP instructions
- ✅ Privacy Policy and Terms links
- ✅ Unbundled consent (optional)

## 🔍 **Pre-Review Checklist**

### **Before Submitting to Twilio:**
- [ ] Website is publicly accessible (no login required)
- [ ] SMS opt-in flow is functional
- [ ] Privacy Policy mentions SMS/Twilio
- [ ] Terms of Service covers SMS usage
- [ ] Contact information is visible
- [ ] Business description is clear
- [ ] All links work properly
- [ ] Mobile-responsive design
- [ ] Professional appearance

### **Test the SMS Flow:**
1. Create a test account
2. Complete job creation
3. Verify SMS opt-in appears
4. Test consent checkbox
5. Verify success message with STOP instructions

## 📸 **Screenshots for Twilio**

Take these screenshots from your live deployment:

1. **Homepage** - Shows business legitimacy
2. **SMS Opt-in UI** - Shows compliance implementation
3. **Privacy Policy** - Shows SMS-specific language
4. **Terms of Service** - Shows service terms
5. **Footer with Links** - Shows compliance links
6. **Success Message** - Shows STOP instructions

## 🎯 **URL Format for Submission**

Your Twilio submission should include:
- **Business Website:** `https://ganbatte.vercel.app` (or your custom domain)
- **SMS Opt-in Page:** `https://ganbatte.vercel.app/chat`
- **Privacy Policy:** `https://ganbatte.vercel.app` (accessible via footer)

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **Environment Variables Missing** - Check Vercel settings
2. **Database Connection** - Verify Supabase URL/key
3. **Build Errors** - Check Vercel build logs
4. **Domain Issues** - Ensure HTTPS is working

### **Support:**
- Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

## 📞 **Next Steps After Deployment**

1. **Test thoroughly** on the live site
2. **Take screenshots** for Twilio submission
3. **Update Isa Bell** with the public URL
4. **Submit to Twilio** for verification
5. **Monitor for any issues**

---

**Deployment Status:** Ready  
**Estimated Time:** 30-60 minutes  
**Cost:** Free (Vercel free tier)  
**Maintenance:** Automatic deployments on Git push 