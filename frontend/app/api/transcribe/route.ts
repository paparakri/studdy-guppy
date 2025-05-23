// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with file data.' 
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { fileKey, documentId } = await request.json();

    // Validate input
    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    // TODO: Start AWS Transcribe job
    // TODO: Poll for completion or use webhooks
    // TODO: Get transcription text
    // TODO: Update document with transcribed text
    // TODO: Trigger text analysis

    return NextResponse.json({
      status: 'processing',
      jobId: 'placeholder-transcribe-job-id',
      fileKey,
      documentId,
      estimatedTime: '2-5 minutes',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transcribe API Error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}