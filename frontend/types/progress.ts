// types/progress.ts - NEW FILE
export interface ChapterProgress {
    chapterId: string;
    chapterTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number; // percentage 0-100
    lastStudied: string; // ISO timestamp
    difficultyLevel: 'easy' | 'medium' | 'hard';
    needsReview: boolean;
  }
  
  export interface TopicProgress {
    topicName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    lastStudied: string;
  }
  
  export interface UserProgress {
    userId: string;
    overallAccuracy: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    studyStreak: number; // days
    lastStudyDate: string;
    totalStudyTime: number; // minutes
    documentProgress: Record<string, DocumentProgress>; // documentId -> progress
    chapterProgress: Record<string, ChapterProgress>; // chapterId -> progress  
    topicProgress: Record<string, TopicProgress>; // topicName -> progress
    weakAreas: string[]; // chapter/topic IDs that need more practice
    strongAreas: string[]; // chapter/topic IDs that are mastered
    createdAt: string;
    updatedAt: string;
  }
  
  export interface DocumentProgress {
    documentId: string;
    documentName: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    chaptersStudied: string[];
    lastStudied: string;
    isCompleted: boolean;
  }
  
  export interface QuestionResult {
    questionId: string;
    question: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    chapterId?: string;
    chapterTitle?: string;
    topicName?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeSpent: number; // seconds
    timestamp: string;
  }
  
  export interface StudySessionResult {
    sessionId: string;
    userId: string;
    sessionType: 'quiz' | 'flashcards';
    documentIds: string[];
    questionResults: QuestionResult[];
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    timeSpent: number; // total session time in seconds
    completedAt: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }
  
  export interface ProgressUpdateRequest {
    userId: string;
    sessionResult: StudySessionResult;
  }
  
  export interface ProgressAnalytics {
    overallProgress: number; // 0-100
    byChapter: Record<string, number>; // chapterId -> progress percentage
    byTopic: Record<string, number>; // topicName -> progress percentage
    recentSessions: StudySessionResult[];
    improvementAreas: {
      chapterId: string;
      chapterTitle: string;
      currentAccuracy: number;
      recommendedAction: string;
    }[];
    achievements: {
      name: string;
      description: string;
      unlockedAt: string;
    }[];
  }
  
  // Enhanced question interface with chapter mapping
  export interface EnhancedQuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    chapterId?: string;
    chapterTitle?: string;
    topicName?: string;
    sourceDocumentId: string;
  }
  
  // Enhanced flashcard interface with chapter mapping
  export interface EnhancedFlashcard {
    id: number;
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    chapterId?: string;
    chapterTitle?: string;
    topicName?: string;
    sourceDocumentId: string;
  }
  
  // Progress calculation utilities
  export interface ProgressCalculationConfig {
    minimumQuestionsForAccuracy: number; // minimum questions needed for reliable accuracy
    accuracyThresholdForMastery: number; // accuracy needed to consider a chapter "mastered"
    accuracyThresholdForReview: number; // accuracy below which chapter needs review
    streakRequirement: number; // consecutive correct answers for mastery
  }
  
  export const DEFAULT_PROGRESS_CONFIG: ProgressCalculationConfig = {
    minimumQuestionsForAccuracy: 5,
    accuracyThresholdForMastery: 85, // 85%
    accuracyThresholdForReview: 60, // Below 60% needs review
    streakRequirement: 3
  };
  
  // API Response types
  export interface GetProgressResponse {
    userProgress: UserProgress;
    analytics: ProgressAnalytics;
    timestamp: string;
  }
  
  export interface UpdateProgressResponse {
    success: boolean;
    updatedProgress: UserProgress;
    newAchievements?: string[];
    timestamp: string;
  }