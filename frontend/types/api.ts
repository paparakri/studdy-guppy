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
  
  // Add more interfaces as needed