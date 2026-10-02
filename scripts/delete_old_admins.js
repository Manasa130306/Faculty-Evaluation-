const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { users } } = await sbAdmin.auth.admin.listUsers();
  const toDelete = users.filter(u => u.email === 'nsre01@nsriet.edu.in' || u.email === 'admin_admin101@nsriet.edu.in');
  for (const u of toDelete) {
    await sbAdmin.auth.admin.deleteUser(u.id);
    console.log('Deleted user:', u.email);
  }
}

run();
