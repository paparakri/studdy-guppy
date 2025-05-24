// app/api/transcription-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transcribeClient, s3Client, comprehendClient, callClaude } from '@/lib/aws-config';
import { GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { DetectSentimentCommand, DetectKeyPhrasesCommand } from '@aws-sdk/client-comprehend';
import { getComprehendCapabilities, isGreekLanguage, enhanceGreekText, cleanTranscriptText } from '@/lib/comprehend-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('jobName');
    const documentId = searchParams.get('documentId');

    if (!jobName || !documentId) {
      return NextResponse.json(
        { error: 'Job name and document ID are required' },
        { status: 400 }
      );
    }

    // Get transcription job status
    const response = await transcribeClient.send(
      new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      })
    );

    const job = response.TranscriptionJob;
    
    if (!job) {
      return NextResponse.json(
        { error: 'Transcription job not found' },
        { status: 404 }
      );
    }

    const status = job.TranscriptionJobStatus;

    if (status === 'COMPLETED') {
      // Download and process the transcript
      const transcriptUri = job.Transcript?.TranscriptFileUri;
      const detectedLanguage = job.LanguageCode;
      
      if (transcriptUri) {
        // Fetch the transcript JSON
        const transcriptResponse = await fetch(transcriptUri);
        const transcriptData = await transcriptResponse.json();
        
        // Format transcript with speakers (similar to Python script)
        let formattedText = formatTranscriptWithSpeakers(transcriptData);
        
        try {
          const errorCorrectionPrompt = `Please fix any transcription errors in the following text while preserving the original meaning and speaker labels. Correct spelling mistakes, grammar errors, and obvious transcription artifacts, but keep the content and structure intact:
          ${formattedText}
          Return only the corrected text without any additional commentary.`;
        
          const correctedText = await callClaude(errorCorrectionPrompt, 4000);
          formattedText = correctedText;
        } catch (error) {
          console.warn('Claude error correction failed:', error);
          // Continue with original text if Claude fails
        }

        // If Greek or any supported language, improve with Comprehend
        let finalText = formattedText;
        if (detectedLanguage) {
          try {
            finalText = await improveTextWithComprehend(formattedText, detectedLanguage);
          } catch (error) {
            console.warn('Text improvement failed:', error);
            // Use original text if Comprehend fails
          }
        }
        
        // Update the text file in S3
        const textKey = `uploads/${documentId}-text.txt`;
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: textKey,
          Body: Buffer.from(finalText, 'utf-8'),
          ContentType: 'text/plain',
        }));

        return NextResponse.json({
          status: 'completed',
          text: finalText,
          language: detectedLanguage,
          textPreview: finalText.substring(0, 200) + (finalText.length > 200 ? '...' : ''),
          timestamp: new Date().toISOString()
        });
      }
    } else if (status === 'FAILED') {
      const failureReason = job.FailureReason;
      return NextResponse.json({
        status: 'failed',
        error: failureReason || 'Transcription failed',
        timestamp: new Date().toISOString()
      });
    } else {
      // Still in progress
      return NextResponse.json({
        status: 'in_progress',
        progress: status, // QUEUED, IN_PROGRESS, etc.
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Transcription status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check transcription status' },
      { status: 500 }
    );
  }
}

function formatTranscriptWithSpeakers(transcriptData: any): string {
  try {
    const items = transcriptData.results?.items || [];
    const speakerSegments = transcriptData.results?.speaker_labels?.segments || [];

    // Create speaker mapping
    const speakerMap: { [key: number]: string } = {};
    for (const segment of speakerSegments) {
      const speaker = segment.speaker_label;
      for (const item of segment.items || []) {
        if (typeof item.item_index === 'number') {
          speakerMap[item.item_index] = speaker;
        }
      }
    }

    // Build formatted text
    const result: string[] = [];
    let currentSpeaker: string | null = null;
    let currentText: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type === 'pronunciation') {
        const speaker = speakerMap[i] || 'Unknown';
        const word = item.alternatives?.[0]?.content || '';

        if (speaker !== currentSpeaker) {
          if (currentText.length > 0) {
            result.push(`[${currentSpeaker}]: ${currentText.join(' ')}`);
          }
          currentSpeaker = speaker;
          currentText = [word];
        } else {
          currentText.push(word);
        }
      } else if (item.type === 'punctuation' && currentText.length > 0) {
        const punctuation = item.alternatives?.[0]?.content || '';
        currentText[currentText.length - 1] += punctuation;
      }
    }

    // Add final speaker text
    if (currentText.length > 0) {
      result.push(`[${currentSpeaker}]: ${currentText.join(' ')}`);
    }

    return result.join('\n\n');
  } catch (error) {
    console.error('Error formatting transcript:', error);
    // Fallback to simple transcript
    return transcriptData.results?.transcripts?.[0]?.transcript || 'Transcription formatting failed';
  }
}

async function improveTextWithComprehend(text: string, detectedLanguage: string): Promise<string> {
  try {
    // Check what Comprehend operations are supported for this language
    const capabilities = getComprehendCapabilities(detectedLanguage);
    
    if (!capabilities) {
      console.log(`Language ${detectedLanguage} not supported by Comprehend`);
      return cleanTranscriptText(text);
    }
    
    console.log(`Comprehend capabilities for ${detectedLanguage}:`, capabilities);
    
    const textChunk = text.substring(0, 5000); // Comprehend has text limits
    let keyPhrases, sentiment;
    
    // Map Transcribe language codes to Comprehend language codes
    const comprehendLanguageCode = mapToComprehendLanguageCode(detectedLanguage);
    
    if (!comprehendLanguageCode) {
      console.log(`Cannot map ${detectedLanguage} to Comprehend language code`);
      return cleanTranscriptText(text);
    }
    
    // Use supported operations based on language capabilities
    if (capabilities.keyPhrases) {
      try {
        const keyPhrasesResponse = await comprehendClient.send(new DetectKeyPhrasesCommand({
          Text: textChunk,
          LanguageCode: 'el' as any // Use the mapped language code
        }));
        const detectedKeyPhrases = keyPhrasesResponse.KeyPhrases;
        keyPhrases = detectedKeyPhrases;
        console.log(`Detected ${detectedKeyPhrases?.length || 0} key phrases`);
      } catch (error) {
        console.warn('Key phrases detection failed:', error);
      }
    }
    
    if (capabilities.sentiment) {
      try {
        const sentimentResponse = await comprehendClient.send(new DetectSentimentCommand({
          Text: textChunk,
          LanguageCode: 'el' as any // Use the mapped language code
        }));
        sentiment = {
          sentiment: sentimentResponse.Sentiment,
          scores: sentimentResponse.SentimentScore
        };
        console.log('Detected sentiment:', sentiment.sentiment);
      } catch (error) {
        console.warn('Sentiment detection failed:', error);
      }
    }
    
    // Apply language-specific improvements
    if (isGreekLanguage(detectedLanguage)) {
      return enhanceGreekText(text, keyPhrases, sentiment);
    } else {
      // For other languages, just clean the text
      return cleanTranscriptText(text);
    }
    
  } catch (error) {
    console.warn('Comprehensive text improvement failed:', error);
    return cleanTranscriptText(text);
  }
}

// Helper function to map Transcribe language codes to Comprehend language codes
function mapToComprehendLanguageCode(transcribeLanguageCode: string): string | null {
  const languageMap: { [key: string]: string } = {
    'el-GR': 'el',      // Greek
    'en-US': 'en',      // English
    'en-GB': 'en',      // English
    'es-ES': 'es',      // Spanish
    'fr-FR': 'fr',      // French
    'de-DE': 'de',      // German
    'it-IT': 'it',      // Italian
    'pt-PT': 'pt',      // Portuguese
    'zh-CN': 'zh',      // Chinese
    'ja-JP': 'ja',      // Japanese
    'ko-KR': 'ko',      // Korean
    'ar-SA': 'ar',      // Arabic
    'hi-IN': 'hi',      // Hindi
  };
  
  return languageMap[transcribeLanguageCode] || null;
}