import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      configured: false,
      url: url || 'Not provided',
      message:
        'Supabase credentials in .env.local are currently using placeholder values. Please replace NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with your live Supabase project values.',
    });
  }

  try {
    const supabase = await createClient();

    // Check all required production tables
    const [facultyRes, evalsRes, headsRes, locksRes, profilesRes] = await Promise.all([
      supabase.from('faculty').select('faculty_id').limit(1),
      supabase.from('evaluations').select('id').limit(1),
      supabase.from('evaluation_heads').select('id').limit(1),
      supabase.from('month_locks').select('id').limit(1),
      supabase.from('profiles').select('faculty_id').limit(1),
    ]);

    const tablesStatus = {
      faculty: !facultyRes.error,
      evaluations: !evalsRes.error,
      evaluation_heads: !headsRes.error,
      month_locks: !locksRes.error,
      profiles: !profilesRes.error,
    };

    const allTablesExist = Object.values(tablesStatus).every(Boolean);

    return NextResponse.json({
      connected: true,
      configured: true,
      url,
      tables: tablesStatus,
      schemaReady: allTablesExist,
      message: allTablesExist
        ? 'All required production tables and schema verified successfully!'
        : 'Supabase connected. Run the migration script in supabase/migrations/20260913000002_create_production_faculty_system.sql in your Supabase SQL editor to create all required tables.',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        configured: true,
        url,
        message: `Schema verification error: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
