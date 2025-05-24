// types/study.ts
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'text';
  uploadedAt: string;
  processedAt?: string;
  content?: string;
  summary?: string;
  status: 'uploaded' | 'processed' | 'transcribing' | 'transcription_error' | 'pdf_error';
  transcriptionJobName?: string;
  detectedLanguage?: string;
  hasText: boolean;
  textPreview?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  documentId: string;
  type: 'quiz' | 'flashcards' | 'chat';
  score?: number;
  completedAt: string;
}

export interface TranscriptionJob {
  jobName: string;
  documentId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  language?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface FileUploadResult {
  documentId: string;
  fileName: string;
  fileType: 'pdf' | 'video' | 'audio' | 'text' | 'other';
  originalFileKey: string;
  textFileKey: string;
  transcriptionJobName?: string;
  status: 'uploaded' | 'processed' | 'transcribing' | 'transcription_error' | 'pdf_error';
  hasText: boolean;
  textPreview: string;
  isTranscribing: boolean;
}

export interface TranscriptionStatus {
  status: 'in_progress' | 'completed' | 'failed';
  progress?: string;
  text?: string;
  language?: string;
  textPreview?: string;
  error?: string;
  timestamp: string;
}