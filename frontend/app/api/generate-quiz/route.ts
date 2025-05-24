// app/api/generate-quiz/route.ts - MODIFIED FILE
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, s3Client } from '@/lib/aws-config';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { progressStorage, progressCalculator } from '@/lib/progress-utils';
import type { EnhancedQuizQuestion } from '@/types/progress';

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with document data.' 
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { 
      documentIds, 
      difficulty = 'medium', 
      questionCount = 10,
      userId = 'default-user', // Added for progress tracking
      useAdaptiveLearning = true // New flag for adaptive learning
    } = await request.json();

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Document IDs array is required' },
        { status: 400 }
      );
    }

    let combinedContent = "";
    let summaryData = null;
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

    // Get user progress for adaptive learning
    let userProgress = null;
    let adaptiveParams = null;
    
    if (useAdaptiveLearning) {
      try {
        userProgress = await progressStorage.getUserProgress(userId);
        if (userProgress) {
          adaptiveParams = progressCalculator.generateAdaptiveQuizParams(
            userProgress, 
            difficulty, 
            questionCount
          );
        }
      } catch (error) {
        console.log('Could not load user progress, using standard quiz generation');
      }
    }

    // First, get document summary to understand chapter structure
    try {
      const summaryResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds, summaryType: 'detailed' })
      });
      
      if (summaryResponse.ok) {
        summaryData = await summaryResponse.json();
      }
    } catch (error) {
      console.log('Could not fetch summary data for chapter mapping');
    }

    // Create enhanced prompt for Claude with chapter mapping and adaptive learning
    const prompt = createEnhancedQuizPrompt({
      content: combinedContent,
      questionCount,
      difficulty,
      summaryData,
      adaptiveParams,
      userProgress,
      documentIds
    });

    const claudeResponse = await callClaude(prompt, 6000); // Increased token limit for enhanced response
    
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
      
      // Create fallback questions with basic chapter mapping
      questions = createFallbackQuestions(combinedContent, questionCount, summaryData, documentIds);
    }

    // Ensure questions have proper enhanced structure
    const enhancedQuestions: EnhancedQuizQuestion[] = questions.map((q: any, index: number) => ({
      id: q.id || index + 1,
      question: typeof q.question === 'string' ? q.question : `Question ${index + 1} from study materials`,
      options: Array.isArray(q.options) && q.options.length === 4 
        ? q.options.map((opt: string) => typeof opt === 'string' ? opt : 'Option text') 
        : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 
        ? q.correctAnswer 
        : 0,
      explanation: typeof q.explanation === 'string' ? q.explanation : "This is the correct answer based on the study materials.",
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : difficulty,
      chapterId: q.chapterId || `chapter-${Math.floor(index / (questionCount / 3)) + 1}`,
      chapterTitle: q.chapterTitle || extractChapterTitle(summaryData, index, questionCount),
      topicName: q.topicName || extractTopicName(summaryData, index),
      sourceDocumentId: documentIds[0] // Simplified for now
    }));

    return NextResponse.json({
      questions: enhancedQuestions,
      documentIds,
      difficulty,
      totalQuestions: enhancedQuestions.length,
      timestamp: new Date().toISOString(),
      adaptiveParams: adaptiveParams || null,
      userProgress: userProgress ? {
        overallAccuracy: userProgress.overallAccuracy,
        weakAreas: userProgress.weakAreas,
        strongAreas: userProgress.strongAreas
      } : null
    });
  } catch (error) {
    console.error('Quiz Generation API Error:', error);
    return NextResponse.json(
      { error: 'Quiz generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Enhanced prompt creation function
function createEnhancedQuizPrompt({
  content,
  questionCount,
  difficulty,
  summaryData,
  adaptiveParams,
  userProgress,
  documentIds
}: {
  content: string;
  questionCount: number;
  difficulty: string;
  summaryData: any;
  adaptiveParams: any;
  userProgress: any;
  documentIds: string[];
}) {
  let adaptiveInstructions = '';
  let chapterContext = '';

  // Add chapter context if available
  if (summaryData?.chapters) {
    chapterContext = `
CHAPTER STRUCTURE:
${summaryData.chapters.map((chapter: any, index: number) => 
  `Chapter ${index + 1} (ID: chapter-${index + 1}): ${chapter.title}
  Key Points: ${chapter.keyPoints?.slice(0, 3).join(', ') || 'N/A'}`
).join('\n')}

KEY TOPICS: ${summaryData.keyTopics?.join(', ') || 'N/A'}
`;
  }

  // Add adaptive learning instructions if user progress is available
  if (adaptiveParams && userProgress) {
    adaptiveInstructions = `
ADAPTIVE LEARNING INSTRUCTIONS:
- User's overall accuracy: ${userProgress.overallAccuracy.toFixed(1)}%
- Focus on these weak areas: ${adaptiveParams.focusChapters.join(', ') || 'None identified'}
- Question difficulty distribution: 
  * Easy: ${adaptiveParams.difficultyDistribution.easy} questions
  * Medium: ${adaptiveParams.difficultyDistribution.medium} questions  
  * Hard: ${adaptiveParams.difficultyDistribution.hard} questions
- Generate ${Math.floor(questionCount * 0.6)} questions from weak areas if available
- Remaining questions should cover other important concepts
`;
  }

  return `
You are an expert educator creating an adaptive quiz. Based on the following study materials, create exactly ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

${chapterContext}

${adaptiveInstructions}

Study Materials:
${content}

IMPORTANT INSTRUCTIONS:
- Create exactly ${questionCount} multiple-choice questions
- Difficulty level: ${difficulty}
- Each question must have exactly 4 answer options
- Only one option should be correct
- Keep explanations concise (1-2 sentences)
- Make questions specific to the content provided
- Ensure incorrect options are plausible but clearly wrong
- Map each question to a chapter ID and topic when possible

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
    "explanation": "Brief explanation of why option A is correct.",
    "difficulty": "medium",
    "chapterId": "chapter-1",
    "chapterTitle": "Introduction to the Topic",
    "topicName": "Key Concept Name"
  }
]

The correctAnswer should be the index (0, 1, 2, or 3) of the correct option.
Map questions to appropriate chapters based on the chapter structure provided above.
If no specific chapter applies, use "chapter-general" as chapterId.
Return only the JSON array, no other text.
    `;
}

// Helper functions
function createFallbackQuestions(
  content: string, 
  questionCount: number, 
  summaryData: any, 
  documentIds: string[]
): EnhancedQuizQuestion[] {
  const lines = content.split('\n').filter(line => line.trim().length > 20);
  const sampleLines = lines.slice(0, Math.min(questionCount, lines.length));
  
  return sampleLines.map((content, index) => ({
    id: index + 1,
    question: `Based on the study materials, which statement about "${content.substring(0, 30)}..." is most accurate?`,
    options: [
      "This concept is correctly described in the materials",
      "This concept is not mentioned in the materials",
      "This concept is contradicted by the materials", 
      "This concept needs further clarification"
    ],
    correctAnswer: 0,
    explanation: "Based on the study materials provided, this concept is accurately described.",
    difficulty: 'medium' as const,
    chapterId: `chapter-${Math.floor(index / Math.max(1, questionCount / 3)) + 1}`,
    chapterTitle: extractChapterTitle(summaryData, index, questionCount),
    topicName: extractTopicName(summaryData, index),
    sourceDocumentId: documentIds[0]
  }));
}

function extractChapterTitle(summaryData: any, questionIndex: number, totalQuestions: number): string {
  if (summaryData?.chapters) {
    const chapterIndex = Math.floor(questionIndex / Math.max(1, totalQuestions / summaryData.chapters.length));
    return summaryData.chapters[chapterIndex]?.title || 'General Concepts';
  }
  return 'General Concepts';
}

function extractTopicName(summaryData: any, questionIndex: number): string {
  if (summaryData?.keyTopics && summaryData.keyTopics.length > 0) {
    return summaryData.keyTopics[questionIndex % summaryData.keyTopics.length];
  }
  return 'Study Material Concepts';
}