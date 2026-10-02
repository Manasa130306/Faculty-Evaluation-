require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.from('faculty').select('*', { count: 'exact' }).then(res => {
  console.log('Count:', res.count);
  console.log('Faculty:');
  res.data.forEach(f => console.log(f.faculty_id));
}).catch(console.error);
