// types/study.ts
export interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'video' | 'audio' | 'text';
    uploadedAt: string;
    processedAt?: string;
    content?: string;
    summary?: string;
  }
  
  export interface StudySession {
    id: string;
    userId: string;
    documentId: string;
    type: 'quiz' | 'flashcards' | 'chat';
    score?: number;
    completedAt: string;
  }
  
  // Add more types as needed