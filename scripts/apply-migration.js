const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  try {
    console.log('🔍 Applying migration to add default_address column...');
    
    const sql = `
      ALTER TABLE twilio_customers 
      ADD COLUMN IF NOT EXISTS default_address TEXT;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'twilio_customers')
      .eq('column_name', 'default_address');
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
    } else {
      console.log('✅ Verified default_address column exists:', columns.length > 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

applyMigration(); 