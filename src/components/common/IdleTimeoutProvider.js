import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useIdleTimer from '../../hooks/useIdleTimer';
import IdleTimeoutWarning from './IdleTimeoutWarning';
import { SESSION_CONFIG, isPublicRoute, log } from '../../config/sessionConfig';

const IdleTimeoutProvider = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is on a page that requires authentication
  const isProtectedRoute = useCallback(() => {
    return !isPublicRoute(location.pathname);
  }, [location.pathname]);

  // Check if user is logged in
  const isLoggedIn = useCallback(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    log('Logging out user due to inactivity');
    
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    
    // Hide warning modal
    setShowWarning(false);
    
    // Navigate to login page
    navigate('/login', { replace: true });
    
    log('User logged out successfully');
  }, [navigate]);

  // Handle warning (30 seconds before logout)
  const handleWarning = useCallback(() => {
    // Only show warning if user is logged in and on protected route
    if (isLoggedIn() && isProtectedRoute()) {
      log('Showing idle timeout warning');
      setShowWarning(true);
    }
  }, [isLoggedIn, isProtectedRoute]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    // Hide warning if user becomes active
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Handle idle timeout
  const handleIdle = useCallback(() => {
    // Only logout if user is logged in and on protected route
    if (isLoggedIn() && isProtectedRoute()) {
      handleLogout();
    }
  }, [handleLogout, isLoggedIn, isProtectedRoute]);

  // Handle "Stay Signed In" button
  const handleStaySignedIn = useCallback(() => {
    log('User chose to stay signed in');
    setShowWarning(false);
    // The useIdleTimer will automatically reset when user interacts
  }, []);

  // Initialize idle timer
  useIdleTimer({
    timeout: SESSION_CONFIG.IDLE_TIMEOUT,
    onIdle: handleIdle,
    onActivity: handleActivity,
    warningTime: SESSION_CONFIG.WARNING_TIME,
    onWarning: handleWarning,
    debounce: SESSION_CONFIG.ACTIVITY_DEBOUNCE
  });

  // Don't show timer on public routes or when not logged in
  const shouldShowTimer = SESSION_CONFIG.ENABLED && isLoggedIn() && isProtectedRoute();

  return (
    <>
      {children}
      
      {/* Show warning modal only when appropriate */}
      {shouldShowTimer && (
        <IdleTimeoutWarning
          isOpen={showWarning}
          onStaySignedIn={handleStaySignedIn}
          onSignOut={handleLogout}
          warningTime={SESSION_CONFIG.WARNING_TIME / 1000} // Convert to seconds
        />
      )}
    </>
  );
};

export default IdleTimeoutProvider;
