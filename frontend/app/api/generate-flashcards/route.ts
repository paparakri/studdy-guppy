// app/api/generate-flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with document data.' 
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { documentId, cardCount } = await request.json();

    // Validate input
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get document content
    // TODO: Generate flashcard prompt
    // TODO: Call AWS Bedrock
    // TODO: Parse flashcard data
    // TODO: Return flashcards array

    return NextResponse.json({
      flashcards: [
        {
          id: 1,
          front: "What is Machine Learning?",
          back: "A subset of AI that enables computers to learn without explicit programming.",
          difficulty: "easy",
          category: "Fundamentals"
        }
      ],
      documentId,
      totalCards: cardCount || 10,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Flashcard Generation API Error:', error);
    return NextResponse.json(
      { error: 'Flashcard generation failed' },
      { status: 500 }
    );
  }
}