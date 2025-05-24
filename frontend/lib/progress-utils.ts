// lib/progress-utils.ts - NEW FILE
import { s3Client } from '@/lib/aws-config';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  UserProgress,
  ChapterProgress,
  TopicProgress,
  StudySessionResult,
  QuestionResult,
  ProgressAnalytics,
  ProgressCalculationConfig,
  DEFAULT_PROGRESS_CONFIG
} from '@/types/progress';

// Storage utilities using S3
export class ProgressStorage {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME!;
  }

  private getUserProgressKey(userId: string): string {
    return `progress/${userId}/user-progress.json`;
  }

  private getSessionHistoryKey(userId: string): string {
    return `progress/${userId}/session-history.json`;
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.getUserProgressKey(userId)
      }));

      const data = await response.Body?.transformToString();
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('No existing progress found for user:', userId);
      return null;
    }
  }

  async saveUserProgress(progress: UserProgress): Promise<void> {
    await s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.getUserProgressKey(progress.userId),
      Body: JSON.stringify(progress, null, 2),
      ContentType: 'application/json'
    }));
  }

  async getSessionHistory(userId: string): Promise<StudySessionResult[]> {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.getSessionHistoryKey(userId)
      }));

      const data = await response.Body?.transformToString();
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('No session history found for user:', userId);
      return [];
    }
  }

  async addSessionToHistory(userId: string, session: StudySessionResult): Promise<void> {
    const history = await this.getSessionHistory(userId);
    history.push(session);
    
    // Keep only last 50 sessions to prevent excessive data
    const trimmedHistory = history.slice(-50);

    await s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.getSessionHistoryKey(userId),
      Body: JSON.stringify(trimmedHistory, null, 2),
      ContentType: 'application/json'
    }));
  }
}

// Progress calculation utilities
export class ProgressCalculator {
  private config: ProgressCalculationConfig;

  constructor(config: ProgressCalculationConfig = DEFAULT_PROGRESS_CONFIG) {
    this.config = config;
  }

  createInitialUserProgress(userId: string): UserProgress {
    return {
      userId,
      overallAccuracy: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      studyStreak: 0,
      lastStudyDate: new Date().toISOString(),
      totalStudyTime: 0,
      documentProgress: {},
      chapterProgress: {},
      topicProgress: {},
      weakAreas: [],
      strongAreas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  updateProgressWithSession(
    currentProgress: UserProgress, 
    sessionResult: StudySessionResult
  ): UserProgress {
    const updatedProgress = { ...currentProgress };
    
    // Update overall stats
    updatedProgress.totalQuestionsAnswered += sessionResult.totalQuestions;
    updatedProgress.totalCorrectAnswers += sessionResult.correctAnswers;
    updatedProgress.overallAccuracy = (updatedProgress.totalCorrectAnswers / updatedProgress.totalQuestionsAnswered) * 100;
    updatedProgress.totalStudyTime += Math.round(sessionResult.timeSpent / 60); // convert to minutes
    updatedProgress.lastStudyDate = sessionResult.completedAt;
    updatedProgress.updatedAt = new Date().toISOString();

    // Update study streak
    updatedProgress.studyStreak = this.calculateStudyStreak(updatedProgress.lastStudyDate);

    // Update chapter and topic progress
    this.updateChapterProgress(updatedProgress, sessionResult);
    this.updateTopicProgress(updatedProgress, sessionResult);
    this.updateDocumentProgress(updatedProgress, sessionResult);

    // Recalculate weak and strong areas
    this.updateWeakAndStrongAreas(updatedProgress);

    return updatedProgress;
  }

  private updateChapterProgress(progress: UserProgress, session: StudySessionResult): void {
    session.questionResults.forEach(result => {
      if (!result.chapterId) return;

      if (!progress.chapterProgress[result.chapterId]) {
        progress.chapterProgress[result.chapterId] = {
          chapterId: result.chapterId,
          chapterTitle: result.chapterTitle || 'Unknown Chapter',
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          accuracy: 0,
          lastStudied: session.completedAt,
          difficultyLevel: result.difficulty,
          needsReview: false
        };
      }

      const chapterProgress = progress.chapterProgress[result.chapterId];
      chapterProgress.totalQuestions++;
      
      if (result.isCorrect) {
        chapterProgress.correctAnswers++;
      } else {
        chapterProgress.incorrectAnswers++;
      }

      chapterProgress.accuracy = (chapterProgress.correctAnswers / chapterProgress.totalQuestions) * 100;
      chapterProgress.lastStudied = session.completedAt;
      chapterProgress.needsReview = chapterProgress.accuracy < this.config.accuracyThresholdForReview;
    });
  }

  private updateTopicProgress(progress: UserProgress, session: StudySessionResult): void {
    session.questionResults.forEach(result => {
      if (!result.topicName) return;

      if (!progress.topicProgress[result.topicName]) {
        progress.topicProgress[result.topicName] = {
          topicName: result.topicName,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          accuracy: 0,
          lastStudied: session.completedAt
        };
      }

      const topicProgress = progress.topicProgress[result.topicName];
      topicProgress.totalQuestions++;
      
      if (result.isCorrect) {
        topicProgress.correctAnswers++;
      } else {
        topicProgress.incorrectAnswers++;
      }

      topicProgress.accuracy = (topicProgress.correctAnswers / topicProgress.totalQuestions) * 100;
      topicProgress.lastStudied = session.completedAt;
    });
  }

  private updateDocumentProgress(progress: UserProgress, session: StudySessionResult): void {
    session.documentIds.forEach(docId => {
      if (!progress.documentProgress[docId]) {
        progress.documentProgress[docId] = {
          documentId: docId,
          documentName: `Document ${docId}`,
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          chaptersStudied: [],
          lastStudied: session.completedAt,
          isCompleted: false
        };
      }

      const docProgress = progress.documentProgress[docId];
      const docQuestions = session.questionResults.filter(r => 
        session.documentIds.includes(docId)
      );

      docProgress.totalQuestions += docQuestions.length;
      docProgress.correctAnswers += docQuestions.filter(q => q.isCorrect).length;
      docProgress.accuracy = (docProgress.correctAnswers / docProgress.totalQuestions) * 100;
      docProgress.lastStudied = session.completedAt;

      // Update chapters studied
      const newChapters = docQuestions
        .map(q => q.chapterId)
        .filter((chapterId): chapterId is string => !!chapterId)
        .filter(chapterId => !docProgress.chaptersStudied.includes(chapterId));
      
      docProgress.chaptersStudied.push(...newChapters);
    });
  }

  private updateWeakAndStrongAreas(progress: UserProgress): void {
    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    Object.values(progress.chapterProgress).forEach(chapter => {
      if (chapter.totalQuestions >= this.config.minimumQuestionsForAccuracy) {
        if (chapter.accuracy >= this.config.accuracyThresholdForMastery) {
          strongAreas.push(chapter.chapterId);
        } else if (chapter.accuracy < this.config.accuracyThresholdForReview) {
          weakAreas.push(chapter.chapterId);
        }
      }
    });

    progress.weakAreas = weakAreas;
    progress.strongAreas = strongAreas;
  }

  private calculateStudyStreak(lastStudyDate: string): number {
    const lastStudy = new Date(lastStudyDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
    
    // If studied today or yesterday, maintain/increment streak
    // This is a simplified calculation - you might want to track actual consecutive days
    return daysDiff <= 1 ? Math.max(1, daysDiff) : 0;
  }

  generateProgressAnalytics(
    progress: UserProgress, 
    recentSessions: StudySessionResult[]
  ): ProgressAnalytics {
    const byChapter: Record<string, number> = {};
    const byTopic: Record<string, number> = {};

    // Calculate chapter progress percentages
    Object.values(progress.chapterProgress).forEach(chapter => {
      byChapter[chapter.chapterId] = Math.min(100, chapter.accuracy);
    });

    // Calculate topic progress percentages  
    Object.values(progress.topicProgress).forEach(topic => {
      byTopic[topic.topicName] = Math.min(100, topic.accuracy);
    });

    // Generate improvement recommendations
    const improvementAreas = progress.weakAreas.map(chapterId => {
      const chapter = progress.chapterProgress[chapterId];
      return {
        chapterId,
        chapterTitle: chapter?.chapterTitle || 'Unknown Chapter',
        currentAccuracy: chapter?.accuracy || 0,
        recommendedAction: this.getRecommendedAction(chapter?.accuracy || 0)
      };
    });

    // Generate achievements (simplified)
    const achievements = this.generateAchievements(progress);

    return {
      overallProgress: Math.min(100, progress.overallAccuracy),
      byChapter,
      byTopic,
      recentSessions: recentSessions.slice(-10), // Last 10 sessions
      improvementAreas,
      achievements
    };
  }

  private getRecommendedAction(accuracy: number): string {
    if (accuracy < 30) return 'Review fundamentals and retry easier questions';
    if (accuracy < 50) return 'Practice more questions and review explanations';
    if (accuracy < 70) return 'Focus on understanding key concepts';
    return 'A few more practice questions should help';
  }

  private generateAchievements(progress: UserProgress): Array<{name: string, description: string, unlockedAt: string}> {
    const achievements = [];

    if (progress.totalQuestionsAnswered >= 10) {
      achievements.push({
        name: 'Getting Started',
        description: 'Answered your first 10 questions',
        unlockedAt: progress.updatedAt
      });
    }

    if (progress.totalQuestionsAnswered >= 100) {
      achievements.push({
        name: 'Century Club',
        description: 'Answered 100 questions',
        unlockedAt: progress.updatedAt
      });
    }

    if (progress.overallAccuracy >= 80) {
      achievements.push({
        name: 'High Achiever',
        description: 'Maintained 80%+ overall accuracy',
        unlockedAt: progress.updatedAt
      });
    }

    if (progress.strongAreas.length >= 3) {
      achievements.push({
        name: 'Multi-Talented',
        description: 'Mastered 3 or more chapters',
        unlockedAt: progress.updatedAt
      });
    }

    return achievements;
  }

  // Generate adaptive quiz parameters based on user progress
  generateAdaptiveQuizParams(progress: UserProgress, requestedDifficulty: string, requestedCount: number) {
    const adaptiveParams = {
      focusChapters: [] as string[],
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      totalQuestions: requestedCount
    };

    // Focus on weak areas (60% of questions)
    const weakAreasCount = Math.floor(requestedCount * 0.6);
    adaptiveParams.focusChapters = progress.weakAreas.slice(0, 5); // Max 5 focus areas

    // Difficulty distribution based on overall progress
    if (progress.overallAccuracy < 50) {
      // Beginner: mostly easy questions
      adaptiveParams.difficultyDistribution.easy = Math.floor(requestedCount * 0.6);
      adaptiveParams.difficultyDistribution.medium = Math.floor(requestedCount * 0.3);
      adaptiveParams.difficultyDistribution.hard = requestedCount - adaptiveParams.difficultyDistribution.easy - adaptiveParams.difficultyDistribution.medium;
    } else if (progress.overallAccuracy < 75) {
      // Intermediate: balanced
      adaptiveParams.difficultyDistribution.easy = Math.floor(requestedCount * 0.3);
      adaptiveParams.difficultyDistribution.medium = Math.floor(requestedCount * 0.5);
      adaptiveParams.difficultyDistribution.hard = requestedCount - adaptiveParams.difficultyDistribution.easy - adaptiveParams.difficultyDistribution.medium;
    } else {
      // Advanced: more challenging questions
      adaptiveParams.difficultyDistribution.easy = Math.floor(requestedCount * 0.2);
      adaptiveParams.difficultyDistribution.medium = Math.floor(requestedCount * 0.4);
      adaptiveParams.difficultyDistribution.hard = requestedCount - adaptiveParams.difficultyDistribution.easy - adaptiveParams.difficultyDistribution.medium;
    }

    return adaptiveParams;
  }
}

// Singleton instances
export const progressStorage = new ProgressStorage();
export const progressCalculator = new ProgressCalculator();