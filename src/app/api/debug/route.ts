import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
export async function GET() {
  let supabaseCount = -1;
  let supabaseError = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('faculty').select('*');
      if (error) {
        supabaseError = error.message;
      } else if (data) {
        supabaseCount = data.length;
      }
    } catch (err: any) {
      supabaseError = err.message;
    }
  }

  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured(),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
    supabaseCount,
    supabaseError,
    facultyDataCount: [].length,
  });
}
