// Utility script to promote an existing user to admin
// Run this with: node scripts/promote-to-admin.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!value.startsWith('#')) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
    
    return envVars
  }
  return {}
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure you have:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nThese should be in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteToAdmin() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query) => new Promise((resolve) => rl.question(query, resolve))

  try {
    console.log('🏁 Ganbatte Admin Promotion Tool')
    console.log('================================\n')

    const email = await question('Enter user email to promote to admin: ')

    console.log('\nLooking up user...')

    // Find the user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.error('❌ User not found with that email')
      return
    }

    console.log(`✅ Found user: ${profile.full_name} (${profile.email})`)
    console.log(`Current role: ${profile.role}`)

    if (profile.role === 'admin') {
      console.log('✅ User is already an admin!')
      return
    }

    const confirm = await question('\nPromote this user to admin? (y/N): ')
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Promotion cancelled')
      return
    }

    console.log('\nPromoting user to admin...')

    // Update profile to admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id)

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message)
      return
    }

    console.log('✅ Profile updated to admin role')

    // Create or update staff record
    const { error: staffError } = await supabase
      .from('staff')
      .upsert({
        id: profile.id,
        is_active: true
      })

    if (staffError) {
      console.error('❌ Error creating staff record:', staffError.message)
      return
    }

    console.log('✅ Staff record created/updated')

    console.log('\n🎉 User promoted to admin successfully!')
    console.log(`Email: ${profile.email}`)
    console.log(`Name: ${profile.full_name}`)
    console.log('Role: admin')
    console.log('\nThey can now log in and access the admin panel at /admin/staff')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  } finally {
    rl.close()
  }
}

promoteToAdmin() 