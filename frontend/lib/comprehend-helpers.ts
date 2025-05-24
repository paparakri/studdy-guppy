// lib/comprehend-helpers.ts

// AWS Comprehend language support mapping
export const COMPREHEND_LANGUAGE_SUPPORT = {
    // DetectEntities - Limited language support
    entities: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW'],
    
    // DetectSentiment - Broader language support (includes Greek)
    sentiment: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW', 'el'],
    
    // DetectKeyPhrases - Broader language support (includes Greek)
    keyPhrases: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW', 'el'],
    
    // DetectSyntax - Limited language support
    syntax: ['en', 'es', 'fr', 'de', 'it', 'pt']
  };
  
  // Map AWS Transcribe language codes to Comprehend language codes
  export const TRANSCRIBE_TO_COMPREHEND_LANGUAGE_MAP: Record<string, string> = {
    'en-US': 'en',
    'en-GB': 'en',
    'en-AU': 'en',
    'en-CA': 'en',
    'es-ES': 'es',
    'es-US': 'es',
    'fr-FR': 'fr',
    'fr-CA': 'fr',
    'de-DE': 'de',
    'it-IT': 'it',
    'pt-BR': 'pt',
    'pt-PT': 'pt',
    'ar-SA': 'ar',
    'ar-AE': 'ar',
    'hi-IN': 'hi',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'zh-CN': 'zh',
    'zh-TW': 'zh-TW',
    'el-GR': 'el' // Greek support
  };
  
  export function getComprehendLanguageCode(transcribeLanguageCode: string): string | null {
    return TRANSCRIBE_TO_COMPREHEND_LANGUAGE_MAP[transcribeLanguageCode] || null;
  }
  
  export function isLanguageSupportedForOperation(languageCode: string, operation: keyof typeof COMPREHEND_LANGUAGE_SUPPORT): boolean {
    return COMPREHEND_LANGUAGE_SUPPORT[operation].includes(languageCode);
  }
  
  export interface ComprehendCapabilities {
    entities: boolean;
    sentiment: boolean;
    keyPhrases: boolean;
    syntax: boolean;
    languageCode: string;
  }
  
  export function getComprehendCapabilities(transcribeLanguageCode: string): ComprehendCapabilities | null {
    const comprehendLangCode = getComprehendLanguageCode(transcribeLanguageCode);
    
    if (!comprehendLangCode) {
      return null;
    }
    
    return {
      entities: isLanguageSupportedForOperation(comprehendLangCode, 'entities'),
      sentiment: isLanguageSupportedForOperation(comprehendLangCode, 'sentiment'),
      keyPhrases: isLanguageSupportedForOperation(comprehendLangCode, 'keyPhrases'),
      syntax: isLanguageSupportedForOperation(comprehendLangCode, 'syntax'),
      languageCode: comprehendLangCode
    };
  }
  
  export function isGreekLanguage(languageCode: string): boolean {
    return languageCode === 'el-GR' || languageCode === 'el';
  }
  
  // Text cleaning utilities
  export function cleanTranscriptText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Clean up speaker labels formatting
      .replace(/\[\s*([^\]]+)\s*\]:\s*/g, '[$1]: ')
      // Remove multiple consecutive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();
  }
  
  export function enhanceGreekText(text: string, keyPhrases?: any[], sentiment?: any): string {
    // Basic Greek text enhancement
    let enhanced = cleanTranscriptText(text);
    
    // Add proper spacing around Greek punctuation
    enhanced = enhanced
      .replace(/([;·])/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // You can add more sophisticated Greek language improvements here
    // based on the key phrases and sentiment analysis results
    
    return enhanced;
  }