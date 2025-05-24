// app/api/chat/route.ts - Enhanced with multiple document support:
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, s3Client } from '@/lib/aws-config';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with message data.' 
  }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { message, documentIds } = await request.json();

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let context = "No documents selected. I can answer general questions, but for better help, please select some study materials from the left panel.";
    
    // Get context from multiple selected documents
    if (documentIds && documentIds.length > 0) {
      const documentTexts: string[] = [];
      
      for (const documentId of documentIds) {
        try {
          // Get text from S3
          const textKey = `uploads/${documentId}-text.txt`;
          const response = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: textKey,
          }));
          
          const extractedText = await response.Body?.transformToString();
          if (extractedText) {
            documentTexts.push(`Document ${documentId}:\n${extractedText}`);
          }
        } catch (error) {
          console.error(`Error fetching document ${documentId}:`, error);
          documentTexts.push(`Document ${documentId}: Could not retrieve content.`);
        }
      }
      
      if (documentTexts.length > 0) {
        context = `Here are the study materials you've selected:\n\n${documentTexts.join('\n\n---\n\n')}`;
      }
    }
    
    const prompt = `
You are Study Guppy, an AI study assistant. You help students learn from their study materials.

${context}

User question: ${message}

Instructions:
- Provide helpful, educational responses based on the study materials
- If the question relates to the documents, reference specific content
- If no documents are selected, provide general educational guidance
- Be encouraging and supportive
- Use examples from the materials when possible

Respond in a friendly, helpful manner.
    `;

    const aiResponse = await callClaude(prompt);
    
    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      documentsUsed: documentIds?.length || 0,
      hasContext: documentIds?.length > 0
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Chat failed. Please try again.' },
      { status: 500 }
    );
  }
}