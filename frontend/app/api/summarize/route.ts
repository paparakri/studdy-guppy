// app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, s3Client } from '@/lib/aws-config';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with document data.' 
  }, { status: 405 });
}

interface Chapter {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedReadTime: number;
}

interface SummaryResponse {
  documentIds: string[];
  overallSummary: string;
  chapters: Chapter[];
  keyTopics: string[];
  totalEstimatedTime: number;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { documentIds, summaryType = 'detailed' } = await request.json();

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Document IDs array is required' },
        { status: 400 }
      );
    }

    let combinedContent = "";
    const documentTexts: { id: string; content: string }[] = [];
    
    // Get content from all selected documents
    for (const documentId of documentIds) {
      try {
        // Get text from S3 (following same pattern as other APIs)
        const textKey = `uploads/${documentId}-text.txt`;
        const response = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: textKey,
        }));
        
        const extractedText = await response.Body?.transformToString();
        if (extractedText && extractedText.trim().length > 0) {
          documentTexts.push({ id: documentId, content: extractedText });
          combinedContent += `\n\n=== Document ${documentId} ===\n${extractedText}`;
        }
      } catch (error) {
        console.error(`Error fetching document ${documentId}:`, error);
        // Continue with other documents
      }
    }

    if (combinedContent.trim() === "") {
      return NextResponse.json(
        { error: 'No content found in selected documents' },
        { status: 400 }
      );
    }

    // Create prompt for Claude to generate structured summary with chapters
    const prompt = `
You are an expert educational content analyst. Analyze the following study materials and create a comprehensive, structured summary with clear chapters.

Study Materials:
${combinedContent}

TASK: Create a detailed summary organized into logical chapters. Your response must be in VALID JSON format only, with no additional text.

REQUIRED JSON STRUCTURE:
{
  "overallSummary": "A 2-3 sentence overview of all the content",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Clear, descriptive chapter title",
      "summary": "Detailed summary of this chapter's content (3-4 sentences)",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "estimatedReadTime": 5
    }
  ],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
}

IMPORTANT GUIDELINES:
- Create 3-8 logical chapters based on the content
- Each chapter should represent a distinct topic or concept
- Keep summaries clear and educational
- Include 3-5 key points per chapter
- Estimate read time in minutes (realistic estimates)
- Extract 5-10 main topics covered across all content
- Ensure all JSON is properly formatted and valid
- Do not include any text outside the JSON structure

Return only the JSON object, no other text.
    `;

    const claudeResponse = await callClaude(prompt, 4000);
    
    // Parse Claude's response with robust error handling
    let summaryData: any;
    try {
      // Clean the response and extract JSON
      let jsonStr = claudeResponse.trim();
      
      // Find the JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      // Try to fix incomplete JSON
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        const missingBraces = openBraces - closeBraces;
        for (let i = 0; i < missingBraces; i++) {
          jsonStr += '}';
        }
      }
      
      summaryData = JSON.parse(jsonStr);
      
      // Validate required structure
      if (!summaryData.chapters || !Array.isArray(summaryData.chapters)) {
        throw new Error('Invalid chapters structure');
      }
      
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.error('Claude response preview:', claudeResponse.substring(0, 500));
      
      // Create fallback summary structure
      const contentLines = combinedContent.split('\n').filter(line => line.trim().length > 20);
      const sampleContent = contentLines.slice(0, Math.min(50, contentLines.length));
      
      // Create basic chapters from content
      const chunkSize = Math.ceil(sampleContent.length / 6);
      const fallbackChapters: Chapter[] = [];
      
      for (let i = 0; i < 3; i++) {
        const chunkContent = sampleContent.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunkContent.length > 0) {
          fallbackChapters.push({
            id: `chapter-${i + 1}`,
            title: `Section ${i + 1}`,
            summary: chunkContent.slice(0, 3).join(' ').substring(0, 200) + '...',
            keyPoints: chunkContent.slice(0, 3).map((line, idx) => 
              `Key concept ${idx + 1}: ${line.substring(0, 80)}...`
            ),
            estimatedReadTime: Math.ceil(chunkContent.join(' ').length / 1000) + 2
          });
        }
      }
      
      summaryData = {
        overallSummary: "This document contains important study material covering multiple topics and concepts.",
        chapters: fallbackChapters,
        keyTopics: ["Study Materials", "Key Concepts", "Important Information"]
      };
    }

    // Ensure data structure is valid and clean up
    const validatedChapters: Chapter[] = (summaryData.chapters || []).map((chapter: any, index: number) => ({
      id: chapter.id || `chapter-${index + 1}`,
      title: typeof chapter.title === 'string' ? chapter.title : `Chapter ${index + 1}`,
      summary: typeof chapter.summary === 'string' ? chapter.summary : "This chapter covers important concepts from the study materials.",
      keyPoints: Array.isArray(chapter.keyPoints) 
        ? chapter.keyPoints.filter((point: any) => typeof point === 'string').slice(0, 5)
        : [`Key concept from chapter ${index + 1}`],
      estimatedReadTime: typeof chapter.estimatedReadTime === 'number' && chapter.estimatedReadTime > 0 
        ? chapter.estimatedReadTime 
        : 5
    }));

    const validatedTopics = Array.isArray(summaryData.keyTopics) 
      ? summaryData.keyTopics.filter((topic: any) => typeof topic === 'string').slice(0, 10)
      : ['Study Materials', 'Key Concepts'];

    const totalTime = validatedChapters.reduce((sum, chapter) => sum + chapter.estimatedReadTime, 0);

    const response: SummaryResponse = {
      documentIds,
      overallSummary: typeof summaryData.overallSummary === 'string' 
        ? summaryData.overallSummary 
        : "This content covers important study material with multiple key concepts and topics.",
      chapters: validatedChapters,
      keyTopics: validatedTopics,
      totalEstimatedTime: totalTime,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Summarization API Error:', error);
    return NextResponse.json(
      { error: 'Summarization failed. Please try again.' },
      { status: 500 }
    );
  }
}