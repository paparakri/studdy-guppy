// types/api.ts
export interface UploadRequest {
  // Define later
}

export interface ChatRequest {
  message: string;
  documentId?: string;
  userId?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export interface QuizRequest {
  documentId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Summarization interfaces
export interface SummarizeRequest {
  documentIds: string[];
  summaryType?: 'brief' | 'detailed';
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedReadTime: number;
}

export interface SummarizeResponse {
  documentIds: string[];
  overallSummary: string;
  chapters: Chapter[];
  keyTopics: string[];
  totalEstimatedTime: number;
  timestamp: string;
}

// Add more interfaces as needed