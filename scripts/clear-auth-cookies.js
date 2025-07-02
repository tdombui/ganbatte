#!/usr/bin/env node

/**
 * Script to clear authentication cookies that might be corrupted
 * Run this script if you're experiencing auth issues in development
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Clearing authentication cookies...');

// Clear browser cookies by creating a simple HTML page
const clearCookiesHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear Auth Cookies</title>
</head>
<body>
    <h1>Clearing Authentication Cookies</h1>
    <p>This page will clear any corrupted authentication cookies.</p>
    <script>
        // Clear all Supabase-related cookies
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name] = cookie.split('=');
            if (name.trim().startsWith('sb-')) {
                document.cookie = name.trim() + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                console.log('Cleared cookie:', name.trim());
            }
        });
        
        // Also clear any other auth-related cookies
        const authCookies = ['access_token', 'refresh_token', 'supabase.auth.token'];
        authCookies.forEach(cookieName => {
            document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('Cleared cookie:', cookieName);
        });
        
        alert('Authentication cookies cleared! You can now close this tab and try logging in again.');
    </script>
</body>
</html>
`;

// Write the HTML file to the public directory
const publicDir = path.join(__dirname, '..', 'public');
const clearCookiesPath = path.join(publicDir, 'clear-cookies.html');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(clearCookiesPath, clearCookiesHTML);

console.log('✅ Created clear-cookies.html in public directory');
console.log('📝 Instructions:');
console.log('1. Open http://localhost:3000/clear-cookies.html in your browser');
console.log('2. The page will automatically clear all auth cookies');
console.log('3. Close the tab and try accessing your app again');
console.log('4. You should be redirected to the login page');
console.log('');
console.log('🔧 Additional steps if issues persist:');
console.log('- Clear your browser cache and cookies manually');
console.log('- Restart your development server');
console.log('- Check your Supabase project settings'); 