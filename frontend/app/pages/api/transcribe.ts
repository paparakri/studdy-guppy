// pages/api/transcribe.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileKey, documentId } = req.body;

    // TODO: Start AWS Transcribe job
    // TODO: Poll for completion or use webhooks
    // TODO: Get transcription text
    // TODO: Update document with transcribed text
    // TODO: Trigger text analysis

    res.status(200).json({
      status: 'processing',
      jobId: 'placeholder'
    });
  } catch (error) {
    res.status(500).json({ error: 'Transcription failed' });
  }
}