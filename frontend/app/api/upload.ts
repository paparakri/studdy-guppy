// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Parse multipart form data
    // TODO: Validate file type (PDF, MP3, MP4, etc.)
    // TODO: Upload to S3
    // TODO: If PDF - extract text
    // TODO: If audio/video - trigger transcription
    // TODO: Store file metadata in database
    // TODO: Return file ID and processing status
    
    res.status(200).json({ 
      fileId: 'placeholder',
      status: 'uploaded',
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
}