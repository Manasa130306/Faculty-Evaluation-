import { supabase } from './lib/supabase/client';
import { DataService } from './lib/services/data-service';

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin_nsre01@nsriet.internal',
    password: 'NSRE@ADMIN'
  });
  if (error) {
    console.error('Login error:', error);
    return;
  }
  
  const res = await DataService.getDashboardMetrics(2026, 'September');
  console.log('Metrics:', res);
}
run().catch(console.error);
