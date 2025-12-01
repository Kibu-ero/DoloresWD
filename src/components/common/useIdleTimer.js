import { useEffect, useRef, useCallback } from 'react';
import { SESSION_CONFIG } from '../../config/sessionConfig';

const useIdleTimer = ({ 
  timeout = 300000, // 5 minutes default
  onIdle,
  onActivity,
  warningTime = 30000, // 30 seconds warning
  onWarning,
  debounce = 1000 // 1 second debounce
}) => {
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isIdleRef = useRef(false);
  const hasWarnedRef = useRef(false);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();
    isIdleRef.current = false;
    hasWarnedRef.current = false;

    // Set warning timer (timeout - warningTime)
    const warningDelay = Math.max(0, timeout - warningTime);
    if (warningDelay > 0 && onWarning) {
      warningTimeoutRef.current = setTimeout(() => {
        if (!hasWarnedRef.current && !isIdleRef.current) {
          hasWarnedRef.current = true;
          onWarning();
        }
      }, warningDelay);
    }

    // Set main timeout timer
    timeoutRef.current = setTimeout(() => {
      if (!isIdleRef.current) {
        isIdleRef.current = true;
        onIdle();
      }
    }, timeout);

    // Call activity callback
    if (onActivity && !isIdleRef.current) {
      onActivity();
    }
  }, [timeout, onIdle, onActivity, warningTime, onWarning, clearTimers]);

  // Debounced activity handler
  const debouncedResetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current >= debounce) {
      resetTimer();
    }
  }, [resetTimer, debounce]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    debouncedResetTimer();
  }, [debouncedResetTimer]);

  // Start the timer
  const start = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Stop the timer
  const stop = useCallback(() => {
    clearTimers();
    isIdleRef.current = false;
    hasWarnedRef.current = false;
  }, [clearTimers]);

  // Get current idle status
  const isIdle = useCallback(() => {
    return isIdleRef.current;
  }, []);

  // Get time remaining
  const getTimeRemaining = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    return Math.max(0, timeout - elapsed);
  }, [timeout]);

  useEffect(() => {
    // Events to listen for user activity
    const events = SESSION_CONFIG.ACTIVITY_EVENTS;

    // Add event listeners
    const addEventListener = (event) => {
      document.addEventListener(event, handleActivity, true);
    };

    events.forEach(addEventListener);

    // Start the timer
    start();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      stop();
    };
  }, [handleActivity, start, stop]);

  return {
    start,
    stop,
    reset: resetTimer,
    isIdle,
    getTimeRemaining
  };
};

export default useIdleTimer;

