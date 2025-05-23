// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with message data.' 
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { message, documentId, userId } = await request.json();

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // TODO: Get document context from database
    // TODO: Prepare prompt with context
    // TODO: Call AWS Bedrock (Claude)
    // TODO: Store chat history
    // TODO: Return AI response

    return NextResponse.json({
      response: `You said: "${message}". This is a placeholder AI response.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Chat failed' },
      { status: 500 }
    );
  }
}