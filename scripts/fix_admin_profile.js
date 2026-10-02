const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const adminId = 'c4f0e404-d8da-410d-beb4-0d10429f2e19'; // the one logged in
  
  // Update the existing profile to this new id
  const { data, error } = await sbAdmin.from('profiles').update({ id: adminId }).eq('role', 'admin');
  
  if (error) {
    console.error('Update error:', error);
    // Maybe try inserting a new profile if update fails
    await sbAdmin.from('profiles').insert({
        id: adminId,
        faculty_id: 'NSRE01',
        name: 'Principal / Chief Evaluator',
        department: 'Administration',
        designation: 'Chief Administrator',
        role: 'admin'
    });
    console.log('Inserted new profile for admin');
  } else {
    console.log('Updated profile id to', adminId);
  }
}

run();
