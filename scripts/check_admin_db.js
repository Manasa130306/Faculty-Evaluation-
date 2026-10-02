const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { user }, error: signInError } = await sbAdmin.auth.admin.createUser({
    email: 'admin@nsriet.edu.in',
    password: 'admin123',
    email_confirm: true
  }).catch(() => ({ data: { user: null }, error: null })); // In case it already exists

  // Let's sign in to get the token
  const sbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: sessionData, error: sessionError } = await sbClient.auth.signInWithPassword({
    email: 'admin@nsriet.edu.in',
    password: 'admin123'
  });
  
  if (sessionError) {
    console.error('Sign in error:', sessionError.message);
    return;
  }
  
  const { data, error } = await sbClient.from('faculty').select('*');
  console.log('Admin user fetched count:', data ? data.length : 0);
  if (error) console.error(error);
}

run();
