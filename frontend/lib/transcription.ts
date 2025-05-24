// lib/transcription.ts

export const SUPPORTED_AUDIO_FORMATS = [
  'mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'
];

export const SUPPORTED_VIDEO_FORMATS = [
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'
];

export const ALL_SUPPORTED_FORMATS = [
  ...SUPPORTED_AUDIO_FORMATS,
  ...SUPPORTED_VIDEO_FORMATS,
  'pdf', 'txt', 'docx'
];

export function isAudioFile(filename: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return SUPPORTED_AUDIO_FORMATS.includes(extension || '');
}

export function isVideoFile(filename: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return SUPPORTED_VIDEO_FORMATS.includes(extension || '');
}

export function requiresTranscription(filename: string): boolean {
  return isAudioFile(filename) || isVideoFile(filename);
}

export function getEstimatedTranscriptionTime(fileSizeBytes: number): string {
  // Rough estimation: 1MB of audio/video ≈ 1 minute of content
  // Transcription typically takes 1/4 to 1/2 the duration of the content
  const estimatedMinutes = Math.ceil((fileSizeBytes / (1024 * 1024)) / 4);
  
  if (estimatedMinutes < 1) return 'Less than 1 minute';
  if (estimatedMinutes < 60) return `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
  
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = estimatedMinutes % 60;
  return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
}

export function formatTranscriptionProgress(status: string): string {
  switch (status) {
    case 'QUEUED':
      return 'Queued for processing...';
    case 'IN_PROGRESS':
      return 'Transcribing audio...';
    case 'COMPLETED':
      return 'Transcription complete!';
    case 'FAILED':
      return 'Transcription failed';
    default:
      return 'Processing...';
  }
}

export interface TranscriptionMetadata {
  duration?: number;
  language?: string;
  confidence?: number;
  speakerCount?: number;
}

export function parseTranscriptionMetadata(transcriptData: any): TranscriptionMetadata {
  const metadata: TranscriptionMetadata = {};
  
  try {
    if (transcriptData.results?.speaker_labels?.segments) {
      const speakers = new Set(
        transcriptData.results.speaker_labels.segments.map((segment: any) => segment.speaker_label)
      );
      metadata.speakerCount = speakers.size;
    }
    
    if (transcriptData.results?.items?.length > 0) {
      const confidenceScores = transcriptData.results.items
        .filter((item: any) => item.type === 'pronunciation')
        .map((item: any) => parseFloat(item.alternatives?.[0]?.confidence || 0));
      
      if (confidenceScores.length > 0) {
        metadata.confidence = confidenceScores.reduce((a:any, b:any) => a + b, 0) / confidenceScores.length;
      }
    }
  } catch (error) {
    console.warn('Failed to parse transcription metadata:', error);
  }
  
  return metadata;
}

export function sanitizeTranscriptionText(text: string): string {
  // Remove excessive whitespace and normalize line breaks
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

export const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'es-ES': 'Spanish (Spain)',
  'es-US': 'Spanish (US)',
  'fr-FR': 'French (France)',
  'fr-CA': 'French (Canada)',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'zh-CN': 'Chinese (Mandarin)',
  'zh-TW': 'Chinese (Traditional)',
  'el-GR': 'Greek',
  'ar-SA': 'Arabic (Saudi)',
  'ar-AE': 'Arabic (UAE)',
  'hi-IN': 'Hindi',
  'ru-RU': 'Russian',
  'nl-NL': 'Dutch',
  'sv-SE': 'Swedish',
  'da-DK': 'Danish',
  'no-NO': 'Norwegian',
  'fi-FI': 'Finnish'
};

export function getLanguageName(languageCode: string): string {
  return LANGUAGE_NAMES[languageCode] || languageCode;
}