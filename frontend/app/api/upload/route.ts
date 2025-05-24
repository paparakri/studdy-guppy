// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { s3Client, transcribeClient } from '@/lib/aws-config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import pdf from 'pdf-extraction';

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
    let transcriptionJobName = '';

    // Determine file type and process accordingly
    const fileType = getFileType(file.type, file.name);

    // 1. Upload original file to S3 first
    const originalKey = `uploads/${documentId}-original-${file.name}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: originalKey,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    }));

    // 2. Process file based on type
    if (fileType === 'pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
        processingStatus = 'processed';
      } catch (error) {
        extractedText = 'PDF processing failed';
        processingStatus = 'pdf_error';
      }
    } 
    else if (fileType === 'text') {
      extractedText = buffer.toString('utf-8');
      processingStatus = 'processed';
    }
    else if (fileType === 'video' || fileType === 'audio') {
      // Start AWS Transcribe job for video/audio files
      transcriptionJobName = `transcribe-${documentId}-${Date.now()}`;
      
      try {
        await transcribeClient.send(new StartTranscriptionJobCommand({
          TranscriptionJobName: transcriptionJobName,
          Media: {
            MediaFileUri: `s3://${process.env.S3_BUCKET_NAME}/${originalKey}`
          },
          MediaFormat: getMediaFormat(file.name),
          IdentifyLanguage: true,
          LanguageOptions: ['en-US', 'el-GR', 'es-ES', 'fr-FR', 'de-DE'],
          Settings: {
            ShowSpeakerLabels: true,
            MaxSpeakerLabels: 10
          }
        }));
        
        extractedText = 'Transcription in progress...';
        processingStatus = 'transcribing';
      } catch (error) {
        console.error('Failed to start transcription:', error);
        extractedText = 'Transcription failed to start';
        processingStatus = 'transcription_error';
      }
    }

    // 3. Upload extracted text (even if it's just a placeholder for transcription)
    const textKey = `uploads/${documentId}-text.txt`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: textKey,
      Body: Buffer.from(extractedText, 'utf-8'),
      ContentType: 'text/plain',
    }));

    // 4. Return response with appropriate status
    return NextResponse.json({
      documentId,
      fileName: file.name,
      fileType,
      originalFileKey: originalKey,
      textFileKey: textKey,
      transcriptionJobName,
      status: processingStatus,
      hasText: extractedText.length > 0,
      textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
      isTranscribing: processingStatus === 'transcribing'
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

function generateDocumentId(): string {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getFileType(mimeType: string, fileName: string): 'pdf' | 'video' | 'audio' | 'text' | 'other' {
  // Check by MIME type first
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  
  // Check by file extension as fallback
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
    case 'webm':
    case 'm4v':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'aac':
    case 'm4a':
    case 'ogg':
    case 'flac':
      return 'audio';
    case 'txt':
    case 'md':
    case 'docx':
      return 'text';
    default:
      return 'other';
  }
}

function getMediaFormat(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'mp3':
      return 'mp3';
    case 'mp4':
    case 'm4a':
    case 'm4v':
      return 'mp4';
    case 'wav':
      return 'wav';
    case 'flac':
      return 'flac';
    case 'ogg':
      return 'ogg';
    case 'webm':
      return 'webm';
    default:
      return 'mp4'; // Default fallback
  }
}