const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.rpc('get_policies').then(console.log).catch(err => {
    // try direct query
    sb.from('pg_policies').select('*').then(res => console.log(res.data)).catch(console.error);
});
