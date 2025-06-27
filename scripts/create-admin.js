// Utility script to create the first admin user
// Run this with: node scripts/create-admin.js

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

async function createAdmin() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query) => new Promise((resolve) => rl.question(query, resolve))

  try {
    console.log('🏁 Ganbatte Admin Creation Tool')
    console.log('===============================\n')

    const email = await question('Enter admin email: ')
    const fullName = await question('Enter admin full name: ')
    const password = await question('Enter admin password: ')

    console.log('\nCreating admin user...')

    // Create the user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)
      return
    }

    if (!user.user) {
      console.error('❌ No user returned from creation')
      return
    }

    console.log('✅ User created successfully')

    // Update profile to admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.user.id)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message)
      return
    }

    console.log('✅ Profile updated to admin role')

    // Create staff record
    const { error: staffError } = await supabase
      .from('staff')
      .insert({
        id: user.user.id,
        is_active: true
      })

    if (staffError) {
      console.error('❌ Error creating staff record:', staffError.message)
      return
    }

    console.log('✅ Staff record created')

    console.log('\n🎉 Admin user created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Name: ${fullName}`)
    console.log('Role: admin')
    console.log('\nYou can now log in at your app and access the admin panel at /admin/staff')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  } finally {
    rl.close()
  }
}

createAdmin() 