const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

sbAdmin.from('faculty').select('*').limit(1).then(() => {
  // Can we run raw SQL?
  // We can't easily run raw sql from supabase-js unless we have a rpc.
  // Let's create an rpc if we need to.
}).catch(console.error);

async function checkPolicies() {
    const { data, error } = await sbAdmin.rpc('exec_sql', { query: "SELECT * FROM pg_policies WHERE tablename = 'faculty'" });
    console.log(data, error);
}

checkPolicies();
