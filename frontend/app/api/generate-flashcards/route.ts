// app/api/generate-flashcards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, s3Client } from '@/lib/aws-config';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with document data.' 
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { documentIds, cardCount = 10 } = await request.json();

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Document IDs array is required' },
        { status: 400 }
      );
    }

    let combinedContent = "";
    const documentTexts: string[] = [];
    
    // Get content from all selected documents
    for (const documentId of documentIds) {
      try {
        // Get text from S3 (following same pattern as chat API)
        const textKey = `uploads/${documentId}-text.txt`;
        const response = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: textKey,
        }));
        
        const extractedText = await response.Body?.transformToString();
        if (extractedText) {
          documentTexts.push(`Document ${documentId}:\n${extractedText}`);
          combinedContent += extractedText + "\n\n";
        }
      } catch (error) {
        console.error(`Error fetching document ${documentId}:`, error);
        documentTexts.push(`Document ${documentId}: Could not retrieve content.`);
      }
    }

    if (combinedContent.trim() === "") {
      return NextResponse.json(
        { error: 'No content found in selected documents' },
        { status: 400 }
      );
    }

    // Create prompt for Claude to generate flashcards
    const prompt = `
You are an expert educator creating study flashcards. Based on the following study materials, create exactly ${cardCount} high-quality flashcards.

Study Materials:
${combinedContent}

IMPORTANT INSTRUCTIONS:
- Create exactly ${cardCount} flashcards
- Keep answers concise but comprehensive (max 2-3 sentences each)
- Each flashcard should have a clear, concise question and a complete answer
- Cover the most important concepts, definitions, and key facts
- Vary the difficulty levels (easy, medium, hard)
- Make questions specific and testable
- Include a mix of question types: definitions, concepts, applications, and facts

FORMAT: Return ONLY a valid JSON array with this EXACT structure (no additional text):
[
  {
    "id": 1,
    "question": "What is...",
    "answer": "Concise but complete answer here.",
    "difficulty": "easy",
    "category": "Main topic"
  }
]

Remember: Keep answers brief to ensure the response fits within limits. Return only the JSON array, no other text.
    `;

    const claudeResponse = await callClaude(prompt, 3000); // Increase token limit
    
    // Parse Claude's response with better error handling
    let flashcards;
    try {
      // Clean the response and extract JSON
      let jsonStr = claudeResponse.trim();
      
      // Find the JSON array in the response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      // Try to fix incomplete JSON by adding closing braces if needed
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        const missingBraces = openBraces - closeBraces;
        for (let i = 0; i < missingBraces; i++) {
          jsonStr += '}';
        }
        if (!jsonStr.endsWith(']')) {
          jsonStr += ']';
        }
      }
      
      flashcards = JSON.parse(jsonStr);
      
      // Validate that we have an array
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }
      
      // Validate and clean up each flashcard
      flashcards = flashcards.map((card, index) => ({
        id: card.id || index + 1,
        question: typeof card.question === 'string' ? card.question : `Question ${index + 1}`,
        answer: typeof card.answer === 'string' ? card.answer : "Please review the study materials for this concept.",
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
        category: typeof card.category === 'string' ? card.category : 'General'
      }));
      
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.error('Claude response length:', claudeResponse.length);
      console.error('Claude response preview:', claudeResponse.substring(0, 500));
      
      // Create fallback flashcards based on document content
      const lines = combinedContent.split('\n').filter(line => line.trim().length > 10);
      const sampleContent = lines.slice(0, Math.min(cardCount, lines.length));
      
      flashcards = sampleContent.map((content, index) => ({
        id: index + 1,
        question: `What is the key concept in: "${content.substring(0, 50)}..."?`,
        answer: content.length > 200 ? content.substring(0, 200) + "..." : content,
        difficulty: 'medium',
        category: 'Study Material'
      }));
      
      // If no valid content, create a basic flashcard
      if (flashcards.length === 0) {
        flashcards = [{
          id: 1,
          question: "What are the main topics covered in the study materials?",
          answer: "The materials contain important concepts that should be reviewed carefully. Please check the original documents for detailed information.",
          difficulty: 'medium',
          category: 'General'
        }];
      }
    }
    

    return NextResponse.json({
      flashcards,
      documentIds,
      totalCards: flashcards.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Flashcard Generation API Error:', error);
    return NextResponse.json(
      { error: 'Flashcard generation failed. Please try again.' },
      { status: 500 }
    );
  }
}