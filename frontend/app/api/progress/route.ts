// app/api/progress/route.ts - MODIFIED FILE
import { NextRequest, NextResponse } from 'next/server';
import { progressStorage, progressCalculator } from '@/lib/progress-utils';
import type { 
  ProgressUpdateRequest, 
  GetProgressResponse, 
  UpdateProgressResponse,
  StudySessionResult 
} from '@/types/progress';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user'; // Default for hackathon

    // Get user progress
    let userProgress = await progressStorage.getUserProgress(userId);
    
    // Create initial progress if doesn't exist
    if (!userProgress) {
      userProgress = progressCalculator.createInitialUserProgress(userId);
      await progressStorage.saveUserProgress(userProgress);
    }

    // Get recent session history
    const recentSessions = await progressStorage.getSessionHistory(userId);

    // Generate analytics
    const analytics = progressCalculator.generateProgressAnalytics(userProgress, recentSessions);

    const response: GetProgressResponse = {
      userProgress,
      analytics,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Progress GET API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData: ProgressUpdateRequest = await request.json();
    const { userId, sessionResult } = requestData;

    // Get current progress
    let currentProgress = await progressStorage.getUserProgress(userId);
    
    // Create initial progress if doesn't exist
    if (!currentProgress) {
      currentProgress = progressCalculator.createInitialUserProgress(userId);
    }

    // Update progress with new session
    const updatedProgress = progressCalculator.updateProgressWithSession(currentProgress, sessionResult);

    // Save updated progress
    await progressStorage.saveUserProgress(updatedProgress);

    // Add session to history
    await progressStorage.addSessionToHistory(userId, sessionResult);

    // NEW: Also update guppy system with study time
    try {
      const studyMinutes = Math.round(sessionResult.timeSpent / 60); // Convert seconds to minutes
      if (studyMinutes >= 1) { // Only submit if at least 1 minute
        const guppyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/guppies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            studyMinutes
          })
        });

        if (guppyResponse.ok) {
          console.log(`Added ${studyMinutes} minutes to guppy system for user ${userId}`);
        }
      }
    } catch (guppyError) {
      console.error('Failed to update guppy system:', guppyError);
      // Don't fail the whole request if guppy update fails
    }

    // Check for new achievements (simplified)
    const newAchievements = checkForNewAchievements(currentProgress, updatedProgress);

    const response: UpdateProgressResponse = {
      success: true,
      updatedProgress,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Progress POST API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// Helper function to check for new achievements
function checkForNewAchievements(oldProgress: any, newProgress: any): string[] {
  const newAchievements: string[] = [];

  // Check for milestone achievements
  if (oldProgress.totalQuestionsAnswered < 5 && newProgress.totalQuestionsAnswered >= 5) {
    newAchievements.push('Getting Started - Answered your first 5 questions!');
  }

  if (oldProgress.totalQuestionsAnswered < 50 && newProgress.totalQuestionsAnswered >= 50) {
    newAchievements.push('Half Century - Answered 50 questions!');
  }

  if (oldProgress.totalQuestionsAnswered < 100 && newProgress.totalQuestionsAnswered >= 100) {
    newAchievements.push('Century Club - Answered 100 questions!');
  }

  // Check for accuracy achievements
  if (oldProgress.overallAccuracy < 80 && newProgress.overallAccuracy >= 80) {
    newAchievements.push('High Achiever - Reached 80% overall accuracy!');
  }

  if (oldProgress.overallAccuracy < 90 && newProgress.overallAccuracy >= 90) {
    newAchievements.push('Excellence - Reached 90% overall accuracy!');
  }

  // Check for mastery achievements
  if (oldProgress.strongAreas.length < 3 && newProgress.strongAreas.length >= 3) {
    newAchievements.push('Multi-Talented - Mastered 3 or more chapters!');
  }

  return newAchievements;
}