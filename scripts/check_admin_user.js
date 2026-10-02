const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: sessionData, error: sessionError } = await sbClient.auth.signInWithPassword({
    email: 'admin@nsriet.edu.in',
    password: 'admin123'
  });
  
  if (sessionError) {
    console.error('Sign in error:', sessionError.message);
    return;
  }
  
  console.log('Logged in user ID:', sessionData.user.id);
  const { data: profile } = await sbAdmin.from('profiles').select('*').eq('id', sessionData.user.id).single();
  console.log('Profile for user:', profile);
}

run();
