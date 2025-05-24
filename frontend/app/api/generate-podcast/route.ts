// frontend/app/api/generate-podcast/route.ts - UPDATED to use proxy URLs
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, s3Client, pollyClient } from '@/lib/aws-config';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with document data.' 
  }, { status: 405 });
}

interface PodcastSegment {
  speaker: 'host1' | 'host2';
  text: string;
  timestamp?: number;
}

interface PodcastScript {
  title: string;
  duration: string;
  segments: PodcastSegment[];
}

export async function POST(request: NextRequest) {
  try {
    const { documentIds, podcastStyle = 'conversational', duration = 'medium' } = await request.json();

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
      }
    }

    if (combinedContent.trim() === "") {
      return NextResponse.json(
        { error: 'No content found in selected documents' },
        { status: 400 }
      );
    }

    // Generate podcast script using Claude
    const podcastScript = await generatePodcastScript(combinedContent, podcastStyle, duration);
    
    // Generate audio using Polly
    const audioFiles = await generatePodcastAudio(podcastScript, documentIds);
    
    // Combine audio files (for now, we'll return individual segments)
    const podcastData = {
      id: `podcast_${Date.now()}`,
      title: podcastScript.title,
      duration: podcastScript.duration,
      segments: audioFiles,
      script: podcastScript,
      documentIds,
      timestamp: new Date().toISOString()
    };

    console.log('Generated podcast with segments:', audioFiles.map(seg => ({
      id: seg.id,
      speaker: seg.speaker,
      hasAudio: !!seg.audioUrl,
      audioUrl: seg.audioUrl
    })));

    return NextResponse.json(podcastData);
    
  } catch (error) {
    console.error('Podcast Generation API Error:', error);
    return NextResponse.json(
      { error: 'Podcast generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

async function generatePodcastScript(content: string, style: string, duration: string): Promise<PodcastScript> {
  const durationGuide = {
    'short': '3-5 minutes (about 450-750 words)',
    'medium': '8-12 minutes (about 1200-1800 words)', 
    'long': '15-20 minutes (about 2250-3000 words)'
  };

  const prompt = `
You are an expert podcast script writer. Create an engaging, conversational podcast script based on the following study materials.

CONTENT TO COVER:
${content}

PODCAST REQUIREMENTS:
- Style: ${style}
- Target Duration: ${durationGuide[duration as keyof typeof durationGuide] || durationGuide.medium}
- Format: Two hosts discussing the material (Host 1: Alex, Host 2: Sam)
- Make it educational but engaging and conversational
- Include natural transitions, questions, and explanations
- Break down complex topics into digestible segments
- Add occasional humor or interesting analogies where appropriate

SCRIPT FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "title": "Engaging Podcast Title Here",
  "duration": "${duration}",
  "segments": [
    {
      "speaker": "host1",
      "text": "Welcome to Study Guppy Podcast! I'm Alex, and today we're diving into..."
    },
    {
      "speaker": "host2", 
      "text": "Hey everyone! I'm Sam, and I'm really excited about today's topic because..."
    }
  ]
}

IMPORTANT GUIDELINES:
- Keep each segment between 30-120 words for natural speech flow
- Alternate speakers regularly to maintain engagement
- Include natural conversation elements like "That's a great point, Alex" or "Exactly, Sam"
- Start with an engaging introduction and end with a clear summary
- Make complex topics accessible through conversation
- Include transitions like "Speaking of...", "That reminds me...", "Building on that..."

Generate the complete podcast script now:
  `;

  try {
    const response = await callClaude(prompt, 4000);
    
    // Clean the response and extract JSON
    let jsonStr = response.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const script = JSON.parse(jsonStr);
    
    // Validate structure
    if (!script.segments || !Array.isArray(script.segments)) {
      throw new Error('Invalid script structure');
    }
    
    return script;
    
  } catch (error) {
    console.error('Failed to generate podcast script:', error);
    
    // Fallback script
    return {
      title: "Study Materials Discussion",
      duration: duration,
      segments: [
        {
          speaker: "host1",
          text: "Welcome to Study Guppy Podcast! Today we're exploring some fascinating study materials that cover important concepts and insights."
        },
        {
          speaker: "host2", 
          text: "That's right! These materials contain valuable information that can really enhance our understanding of the subject matter."
        },
        {
          speaker: "host1",
          text: "Let's dive in and break down the key points together, making this content more accessible and engaging for everyone."
        }
      ]
    };
  }
}

async function generatePodcastAudio(script: PodcastScript, documentIds: string[]): Promise<any[]> {
  const audioSegments = [];
  
  // Voice mapping for different speakers
  const voices = {
    host1: 'Matthew', // US English Male
    host2: 'Amy'      // US English Female
  };
  
  for (let i = 0; i < script.segments.length; i++) {
    const segment = script.segments[i];
    const voiceId = voices[segment.speaker];
    
    try {
      console.log(`Generating audio for segment ${i} with voice ${voiceId}`);
      
      // Generate speech using Polly
      const pollyResponse = await pollyClient.send(new SynthesizeSpeechCommand({
        Text: segment.text,
        OutputFormat: 'mp3',
        VoiceId: voiceId /*as any*/,
        Engine: 'neural',
        SampleRate: '22050'
      }));
      
      if (pollyResponse.AudioStream) {
        // Convert stream to buffer
        const audioBuffer = await streamToBuffer(pollyResponse.AudioStream);
        
        // Upload to S3
        const audioKey = `podcasts/podcast_${Date.now()}_segment_${i}_${segment.speaker}.mp3`;
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: audioKey,
          Body: audioBuffer,
          ContentType: 'audio/mpeg',
        }));
        
        console.log(`Uploaded audio segment ${i} to S3: ${audioKey}, size: ${audioBuffer.length} bytes`);
        
        // 🔥 FIXED: Use proxy URL instead of direct S3 URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const audioUrl = `${baseUrl}/api/audio/${encodeURIComponent(audioKey)}`;
        
        audioSegments.push({
          id: i,
          speaker: segment.speaker,
          text: segment.text,
          audioUrl: audioUrl,
          s3Key: audioKey, // Keep track of S3 key for debugging
          voiceId: voiceId,
          duration: estimateAudioDuration(segment.text)
        });
        
        console.log(`Generated segment ${i} with proxy URL: ${audioUrl}`);
      }
      
    } catch (error) {
      console.error(`Failed to generate audio for segment ${i}:`, error);
      
      // Add segment without audio
      audioSegments.push({
        id: i,
        speaker: segment.speaker,
        text: segment.text,
        audioUrl: null,
        error: 'Audio generation failed'
      });
    }
  }
  
  return audioSegments;
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Helper function to estimate audio duration (rough estimate)
function estimateAudioDuration(text: string): number {
  // Average speaking rate is about 150-160 words per minute
  const wordsPerMinute = 155;
  const wordCount = text.split(' ').length;
  return Math.ceil((wordCount / wordsPerMinute) * 60); // Return seconds
}