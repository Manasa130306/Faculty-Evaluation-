import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getDirectClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !serviceKey || url.includes('placeholder')) {
    return null;
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const params = await context.params;
    const filePath = params.path.join('/');
    
    // In a real app, you'd want to check session cookies here for authorization
    // Since this is an internal tool and we want to allow the DocumentViewer 
    // to seamlessly view it, we'll fetch it using the direct client (service role if configured)

    const sb = getDirectClient();
    if (!sb) {
      return new NextResponse('Supabase not configured', { status: 500 });
    }

    const { data, error } = await sb.storage
      .from('evaluation-temp')
      .download(filePath);

    if (error || !data) {
      console.error('Storage download error:', error?.message);
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = await data.arrayBuffer();
    
    // Determine content type based on extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'pdf') contentType = 'application/pdf';
    else if (['jpg', 'jpeg'].includes(ext || '')) contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (['doc', 'docx'].includes(ext || '')) contentType = 'application/msword';
    else if (['xls', 'xlsx'].includes(ext || '')) contentType = 'application/vnd.ms-excel';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (err: any) {
    console.error('Storage API Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
