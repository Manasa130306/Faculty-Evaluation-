import { NextRequest, NextResponse } from 'next/server';
import { getDriveFileMetadataAndStream, isDriveConfigured } from '@/lib/google/drive';
import { verifyAdminSession, verifyFacultySession } from '@/lib/auth/admin-session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    if (!isDriveConfigured()) {
      return NextResponse.json(
        { error: 'Google Drive integration is not configured.' },
        { status: 503 }
      );
    }

    // Security Check: Enforce authentication
    const adminSession = await verifyAdminSession(request);
    const facultySession = await verifyFacultySession(request);

    if (!adminSession.isValid && !facultySession.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to view reference documents.' },
        { status: 401 }
      );
    }

    const { meta, stream } = await getDriveFileMetadataAndStream(fileId);
    const fileName = meta.name || 'document';

    // If requester is faculty (and not admin), verify they own this document
    if (!adminSession.isValid && facultySession.isValid) {
      const reqFacultyId = facultySession.facultyId?.toUpperCase() || '';
      const startsWithFacultyId = reqFacultyId && fileName.toUpperCase().startsWith(`${reqFacultyId}_`);

      if (!startsWithFacultyId && reqFacultyId) {
        let isOwner = false;
        try {
          const supabase = createAdminClient();
          const { data } = await supabase
            .from('evaluation_heads')
            .select('evaluation_id, evaluations(faculty_id)')
            .eq('reference_document_path', fileId)
            .maybeSingle();

          const docOwnerId = (data as any)?.evaluations?.faculty_id?.toUpperCase();
          if (docOwnerId && docOwnerId === reqFacultyId) {
            isOwner = true;
          }
        } catch (dbErr) {
          console.warn('[Drive File Access] DB owner check error:', dbErr);
        }

        if (!isOwner) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to view another faculty member’s documents.' },
            { status: 403 }
          );
        }
      }
    }

    const headers = new Headers();
    if (meta.mimeType) {
      headers.set('Content-Type', meta.mimeType);
    } else {
      headers.set('Content-Type', 'application/octet-stream');
    }

    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    if (meta.size) {
      headers.set('Content-Length', meta.size);
    }

    headers.set('Cache-Control', 'private, max-age=3600, stale-while-revalidate=86400');

    // Create a Web standard ReadableStream from Node.js stream
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: any) => {
          controller.enqueue(chunk);
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err: any) => {
          controller.error(err);
        });
      },
    });

    return new Response(readable, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Error fetching file from Google Drive:', err);
    const status = err?.code === 404 || err?.status === 404 ? 404 : 500;
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve file from Google Drive' },
      { status }
    );
  }
}

