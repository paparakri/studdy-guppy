// app/api/generate-quiz/route.ts
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
    const { documentIds, difficulty = 'medium', questionCount = 10 } = await request.json();

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

    // Create prompt for Claude to generate quiz questions
    const prompt = `
You are an expert educator creating a comprehensive quiz. Based on the following study materials, create exactly ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

Study Materials:
${combinedContent}

IMPORTANT INSTRUCTIONS:
- Create exactly ${questionCount} multiple-choice questions
- Difficulty level: ${difficulty}
- Each question must have exactly 4 answer options
- Only one option should be correct
- Keep explanations concise (1-2 sentences)
- Make questions specific to the content provided
- Ensure incorrect options are plausible but clearly wrong

Difficulty Guidelines:
- Easy: Basic definitions and straightforward facts
- Medium: Concepts requiring understanding and application  
- Hard: Complex analysis, synthesis, and critical thinking

FORMAT: Return ONLY a valid JSON array with this EXACT structure (no additional text):
[
  {
    "id": 1,
    "question": "What is the primary purpose of...?",
    "options": [
      "Option A text",
      "Option B text", 
      "Option C text",
      "Option D text"
    ],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why option A is correct."
  }
]

The correctAnswer should be the index (0, 1, 2, or 3) of the correct option.
Return only the JSON array, no other text.
    `;

    const claudeResponse = await callClaude(prompt, 4000); // Increase token limit for quiz
    
    // Parse Claude's response with better error handling
    let questions;
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
      
      questions = JSON.parse(jsonStr);
      
      // Validate that we have an array
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.error('Claude response length:', claudeResponse.length);
      console.error('Claude response preview:', claudeResponse.substring(0, 500));
      
      // Create fallback questions based on document content
      const lines = combinedContent.split('\n').filter(line => line.trim().length > 20);
      const sampleLines = lines.slice(0, Math.min(questionCount, lines.length));
      
      questions = sampleLines.map((content, index) => ({
        id: index + 1,
        question: `Based on the study materials, which statement about "${content.substring(0, 30)}..." is most accurate?`,
        options: [
          "This concept is correctly described in the materials",
          "This concept is not mentioned in the materials",
          "This concept is contradicted by the materials", 
          "This concept needs further clarification"
        ],
        correctAnswer: 0,
        explanation: "Based on the study materials provided, this concept is accurately described."
      }));
      
      // If no valid content, create a basic question
      if (questions.length === 0) {
        questions = [{
          id: 1,
          question: "Based on the study materials, which statement is most accurate?",
          options: [
            "The material contains important concepts to review",
            "The content is not relevant to studying", 
            "No information was provided",
            "The material is too complex to understand"
          ],
          correctAnswer: 0,
          explanation: "The study materials contain relevant information that should be reviewed for better understanding."
        }];
      }
    }

    // Validate and ensure we have an array with proper structure
    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    // Validate and clean up each question
    questions = questions.map((q, index) => ({
      id: q.id || index + 1,
      question: typeof q.question === 'string' ? q.question : `Question ${index + 1} from study materials`,
      options: Array.isArray(q.options) && q.options.length === 4 
        ? q.options.map((opt: string) => typeof opt === 'string' ? opt : 'Option text') 
        : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 
        ? q.correctAnswer 
        : 0,
      explanation: typeof q.explanation === 'string' ? q.explanation : "This is the correct answer based on the study materials."
    }));

    return NextResponse.json({
      questions,
      documentIds,
      difficulty,
      totalQuestions: questions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quiz Generation API Error:', error);
    return NextResponse.json(
      { error: 'Quiz generation failed. Please try again.' },
      { status: 500 }
    );
  }
}