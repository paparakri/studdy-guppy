// app/api/generate-mindmap/route.ts
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
    const { documentIds, userGuidance } = await request.json();

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
        // Get text from S3 (following same pattern as other APIs)
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

    // Add user guidance to the prompt if provided
    const guidanceSection = userGuidance ? `
    Additional User Guidance for Mind Map Generation:
    ---
    ${userGuidance}
    ---
    ` : "";

    // Create prompt for Claude to generate Mermaid mind map code
    const prompt = `
Based on the following text, generate a Mermaid.js mind map diagram code.
${guidanceSection}

IMPORTANT: Follow this EXACT Mermaid mind map syntax format:

mindmap
  root((Main Topic))
    Branch1
      SubBranch1
      SubBranch2
    Branch2
      SubBranch3
      SubBranch4

RULES:
1. Start with "mindmap" on the first line
2. Use "root((Topic Name))" for the central topic
3. Use proper indentation (2 spaces for each level)
4. Keep labels short (max 3 words)
5. Maximum 3 levels deep
6. Maximum 6 main branches
7. Maximum 4 sub-branches per main branch
8. Use parentheses only for the root node: root((Topic))
9. Do NOT use any other special characters or formatting

Focus on the most essential concepts and relationships.
The output should ONLY contain the Mermaid code, no markdown blocks or explanations.

Text:
---
${combinedContent}
---

Generate the mind map code:
    `;

    try {
      const mermaidCode = await callClaude(prompt, 1000); // Reduced token limit for more focused output
      
      // Clean the response to extract only the Mermaid code
      let cleanedCode = mermaidCode.trim();
      
      // Remove markdown code blocks if present
      if (cleanedCode.includes("```mermaid")) {
        const match = cleanedCode.match(/```mermaid\s*([\s\S]*?)\s*```/);
        if (match) {
          cleanedCode = match[1].trim();
        }
      }
      
      // Remove any remaining markdown blocks
      cleanedCode = cleanedCode.replace(/```[\s\S]*?```/g, '').trim();
      
      // Validate that it starts with "mindmap"
      if (!cleanedCode.startsWith('mindmap')) {
        throw new Error('Invalid mind map format');
      }
      
      // Basic validation - check for proper structure
      const lines = cleanedCode.split('\n');
      if (lines.length < 3) {
        throw new Error('Mind map too simple');
      }
      
      // Validate root node exists
      const hasRoot = lines.some(line => line.trim().includes('root((') && line.trim().includes('))'));
      if (!hasRoot) {
        throw new Error('No root node found');
      }

      return NextResponse.json({
        mermaidCode: cleanedCode,
        documentIds,
        documentsProcessed: documentTexts.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (claudeError) {
      console.error('Claude error or validation failed:', claudeError);
      
      // Create a fallback mind map based on document content
      const fallbackCode = createFallbackMindMap(combinedContent, documentIds.length);
      
      return NextResponse.json({
        mermaidCode: fallbackCode,
        documentIds,
        documentsProcessed: documentTexts.length,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('Mind Map Generation API Error:', error);
    return NextResponse.json(
      { error: 'Mind map generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to create a fallback mind map
function createFallbackMindMap(content: string, docCount: number): string {
  // Extract some key terms from the content
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4)
    .slice(0, 50);

  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Get top words
  const topWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 12)
    .map(([word]) => word);

  // Create a structured mind map
  const rootTopic = docCount > 1 ? 'Study Materials' : 'Document Content';
  
  return `mindmap
  root((${rootTopic}))
    Key Concepts
      ${topWords[0] || 'Concept 1'}
      ${topWords[1] || 'Concept 2'}
      ${topWords[2] || 'Concept 3'}
    Main Topics
      ${topWords[3] || 'Topic 1'}
      ${topWords[4] || 'Topic 2'}
      ${topWords[5] || 'Topic 3'}
    Important Terms
      ${topWords[6] || 'Term 1'}
      ${topWords[7] || 'Term 2'}
      ${topWords[8] || 'Term 3'}
    Additional Info
      ${topWords[9] || 'Info 1'}
      ${topWords[10] || 'Info 2'}
      ${topWords[11] || 'Info 3'}`;
}