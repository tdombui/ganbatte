#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Stripe Webhook Setup Helper');
console.log('================================\n');

console.log('Stripe requires publicly accessible URLs for webhooks. Here are your options:\n');

console.log('1. 🚀 PRODUCTION (Recommended for real payments)');
console.log('   - Use your Vercel deployment URL');
console.log('   - Webhook URLs:');
console.log('     • https://ganbatte-liart.vercel.app/api/webhooks/stripe');
console.log('     • https://ganbatte-liart.vercel.app/api/webhooks/stripe-payment-links');
console.log('   - Environment: LIVE mode');
console.log('   - Payments: REAL money\n');

console.log('2. 🧪 DEVELOPMENT (Recommended for testing)');
console.log('   - Use ngrok to create a public tunnel');
console.log('   - Steps:');
console.log('     a. Run: ngrok http 3001');
console.log('     b. Copy the public URL (e.g., https://abc123.ngrok.io)');
console.log('     c. Use these webhook URLs:');
console.log('        • https://abc123.ngrok.io/api/webhooks/stripe');
console.log('        • https://abc123.ngrok.io/api/webhooks/stripe-payment-links');
console.log('   - Environment: TEST mode');
console.log('   - Payments: FAKE money\n');

console.log('3. 🔄 HYBRID (Development with production webhooks)');
console.log('   - Use production webhook URLs');
console.log('   - But run your app locally');
console.log('   - Requires careful testing\n');

rl.question('Which option do you want to use? (1/2/3): ', (answer) => {
  switch(answer.trim()) {
    case '1':
      console.log('\n✅ PRODUCTION SETUP');
      console.log('==================');
      console.log('1. Go to: https://dashboard.stripe.com/webhooks');
      console.log('2. Create/update webhooks with these URLs:');
      console.log('   • https://ganbatte-liart.vercel.app/api/webhooks/stripe');
      console.log('   • https://ganbatte-liart.vercel.app/api/webhooks/stripe-payment-links');
      console.log('3. Copy the webhook secrets to your environment variables');
      console.log('4. Deploy your app to Vercel');
      console.log('5. Test payments in production');
      break;
      
    case '2':
      console.log('\n✅ DEVELOPMENT SETUP');
      console.log('===================');
      console.log('1. Install ngrok: winget install ngrok');
      console.log('2. Run: ngrok http 3001');
      console.log('3. Copy the public URL (e.g., https://abc123.ngrok.io)');
      console.log('4. Go to: https://dashboard.stripe.com/test/webhooks');
      console.log('5. Create webhooks with these URLs:');
      console.log('   • https://abc123.ngrok.io/api/webhooks/stripe');
      console.log('   • https://abc123.ngrok.io/api/webhooks/stripe-payment-links');
      console.log('6. Copy the webhook secrets to your .env.local');
      console.log('7. Test payments locally');
      break;
      
    case '3':
      console.log('\n✅ HYBRID SETUP');
      console.log('===============');
      console.log('1. Use production webhook URLs in Stripe dashboard');
      console.log('2. But run your app locally for development');
      console.log('3. Webhooks will be sent to production, but you can test locally');
      console.log('4. Be careful - this can be confusing!');
      break;
      
    default:
      console.log('\n❌ Invalid option. Please choose 1, 2, or 3.');
  }
  
  rl.close();
}); 