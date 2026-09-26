import { NextRequest, NextResponse } from 'next/server';
import { getDriveFileMetadataAndStream, isDriveConfigured } from '@/lib/google/drive';

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
        { error: 'Google Drive integration is not configured with service credentials.' },
        { status: 503 }
      );
    }

    const { meta, stream } = await getDriveFileMetadataAndStream(fileId);

    const headers = new Headers();
    if (meta.mimeType) {
      headers.set('Content-Type', meta.mimeType);
    } else {
      headers.set('Content-Type', 'application/octet-stream');
    }

    const fileName = meta.name || 'document';
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    if (meta.size) {
      headers.set('Content-Length', meta.size);
    }

    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

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
