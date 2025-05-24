// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { s3Client } from '@/lib/aws-config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import pdf from 'pdf-extraction';

// app/api/upload/route.ts - Replace the storage logic:

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const documentId = generateDocumentId();
    
    let extractedText = '';
    let processingStatus = 'uploaded';

    // 1. Process file to get text
    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
        processingStatus = 'processed';
      } catch (error) {
        extractedText = 'PDF processing failed';
        processingStatus = 'pdf_error';
      }
    } else if (file.type.startsWith('text/')) {
      extractedText = buffer.toString('utf-8');
      processingStatus = 'processed';
    }

    // 2. Upload BOTH original file AND extracted text to S3
    const originalKey = `uploads/${documentId}-original-${file.name}`;
    const textKey = `uploads/${documentId}-text.txt`;
    
    // Upload original file
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: originalKey,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    }));
    
    // Upload extracted text
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: textKey,
      Body: Buffer.from(extractedText, 'utf-8'),
      ContentType: 'text/plain',
    }));

    // 3. Return just the keys - no in-memory storage needed!
    return NextResponse.json({
      documentId,
      fileName: file.name,
      originalFileKey: originalKey,
      textFileKey: textKey,
      status: processingStatus,
      hasText: extractedText.length > 0,
      textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// Remove all the in-memory storage functions - don't need them!
function generateDocumentId(): string {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}