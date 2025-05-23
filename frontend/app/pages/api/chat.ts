// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import type { ChatRequest, ChatResponse } from '@/types/api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, documentId, userId }: ChatRequest = req.body;

    // TODO: Get document context from database
    // TODO: Prepare prompt with context
    // TODO: Call AWS Bedrock (Claude)
    // TODO: Store chat history
    // TODO: Return AI response

    res.status(200).json({
      response: 'Placeholder AI response',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Chat failed' });
  }
}