const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('faculty').select('*', { count: 'exact' }).then(res => {
  console.log('Count:', res.count);
  console.log('Faculty IDs:');
  res.data.forEach(f => console.log(f.faculty_id));
}).catch(console.error);
