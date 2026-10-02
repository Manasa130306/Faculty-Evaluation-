const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const supabase = createClient(url, key);

async function verify() {
  const { data, error } = await supabase.from('faculty').select('*');
  
  if (error) {
    console.error('Failed to connect to Supabase:', error.message);
    process.exit(1);
  }

  const active = data.filter(f => f.is_active !== false);
  console.log(`TOTAL DB RECORDS: ${data.length}`);
  console.log(`TOTAL ACTIVE FACULTY: ${active.length}`);
  
  if (active.length === 60) {
    console.log('✅ Final Master Verification PASSED: Exactly 60 active faculty records exist in DB.');
  } else {
    console.error(`❌ VERIFICATION FAILED: Expected 60 active faculty, but found ${active.length}.`);
    process.exit(1);
  }
}

verify();
