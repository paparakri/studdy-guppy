// hooks/use-study-time.ts - NEW FILE
import { useState, useEffect, useRef, useCallback } from 'react';

interface StudySession {
  startTime: Date;
  endTime?: Date;
  totalMinutes: number;
  isActive: boolean;
}

interface StudyTimeState {
  currentSession: StudySession | null;
  totalTodayMinutes: number;
  isTracking: boolean;
  lastActivityTime: Date;
}

export function useStudyTime() {
  const [state, setState] = useState<StudyTimeState>({
    currentSession: null,
    totalTodayMinutes: 0,
    isTracking: false,
    lastActivityTime: new Date()
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();
  const userId = 'default-user'; // For hackathon - in real app, get from auth

  // Start tracking study time
  const startStudySession = useCallback(() => {
    const session: StudySession = {
      startTime: new Date(),
      totalMinutes: 0,
      isActive: true
    };

    setState(prev => ({
      ...prev,
      currentSession: session,
      isTracking: true,
      lastActivityTime: new Date()
    }));

    // Start the timer
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.currentSession) return prev;
        
        const now = new Date();
        const totalMinutes = (now.getTime() - prev.currentSession.startTime.getTime()) / (1000 * 60);
        
        return {
          ...prev,
          currentSession: {
            ...prev.currentSession,
            totalMinutes
          }
        };
      });
    }, 1000); // Update every second

    console.log('Study session started');
  }, []);

  // End tracking and submit study time
  const endStudySession = useCallback(async () => {
    if (!state.currentSession || !state.isTracking) return;

    const session = state.currentSession;
    const totalMinutes = Math.round(session.totalMinutes);

    // Only submit if studied for at least 1 minute
    if (totalMinutes >= 1) {
      try {
        const response = await fetch('/api/guppies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            studyMinutes: totalMinutes
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Study session submitted:', totalMinutes, 'minutes');
          
          // If new guppies were earned, you could dispatch an event here
          if (data.newGuppies && data.newGuppies.length > 0) {
            window.dispatchEvent(new CustomEvent('newGuppiesEarned', { 
              detail: { 
                guppies: data.newGuppies, 
                studyMinutes: totalMinutes 
              } 
            }));
          }
        }
      } catch (error) {
        console.error('Failed to submit study time:', error);
      }
    }

    // Clear the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState(prev => ({
      ...prev,
      currentSession: null,
      isTracking: false,
      totalTodayMinutes: prev.totalTodayMinutes + totalMinutes
    }));

    console.log('Study session ended:', totalMinutes, 'minutes');
  }, [state.currentSession, state.isTracking, userId]);

  // Track user activity to detect when they're actively studying
  const recordActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastActivityTime: new Date()
    }));

    // Reset inactivity timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Set new inactivity timeout (5 minutes of inactivity ends session)
    inactivityTimeoutRef.current = setTimeout(() => {
      if (state.isTracking) {
        console.log('Auto-ending study session due to inactivity');
        endStudySession();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [state.isTracking, endStudySession]);

  // Auto-start study session when user interacts with study materials
  const autoStartIfNeeded = useCallback(() => {
    if (!state.isTracking) {
      startStudySession();
    }
    recordActivity();
  }, [state.isTracking, startStudySession, recordActivity]);

  // Manual controls
  const pauseSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState(prev => ({
      ...prev,
      isTracking: false
    }));
  }, []);

  const resumeSession = useCallback(() => {
    if (state.currentSession && !state.isTracking) {
      setState(prev => ({
        ...prev,
        isTracking: true
      }));
      
      // Restart the timer from where we left off
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.currentSession) return prev;
          
          const now = new Date();
          const totalMinutes = (now.getTime() - prev.currentSession.startTime.getTime()) / (1000 * 60);
          
          return {
            ...prev,
            currentSession: {
              ...prev.currentSession,
              totalMinutes
            }
          };
        });
      }, 1000);
    }
  }, [state.currentSession, state.isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return {
    // State
    currentSession: state.currentSession,
    isTracking: state.isTracking,
    totalTodayMinutes: state.totalTodayMinutes,
    
    // Actions
    startStudySession,
    endStudySession,
    pauseSession,
    resumeSession,
    recordActivity,
    autoStartIfNeeded,
    
    // Helpers
    formatTime,
    getCurrentSessionTime: () => state.currentSession?.totalMinutes || 0,
    getFormattedCurrentTime: () => formatTime(state.currentSession?.totalMinutes || 0)
  };
}