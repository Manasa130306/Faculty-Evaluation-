const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const adminId = 'c4f0e404-d8da-410d-beb4-0d10429f2e19';
  
  // Update email and password
  const { data, error } = await sbAdmin.auth.admin.updateUserById(
    adminId,
    { email: 'admin_nsre01@nsriet.internal', password: 'NSRE@ADMIN', email_confirm: true }
  );
  
  if (error) console.error(error);
  else console.log('Updated user:', data.user.email);
}

run();
