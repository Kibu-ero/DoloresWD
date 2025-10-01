// Session timeout configuration
export const SESSION_CONFIG = {
  // Idle timeout in milliseconds (5 minutes)
  IDLE_TIMEOUT: 5 * 60 * 1000,
  
  // Warning time before auto-logout in milliseconds (30 seconds)
  WARNING_TIME: 30 * 1000,
  
  // Debounce time for activity detection in milliseconds (1 second)
  ACTIVITY_DEBOUNCE: 1000,
  
  // Events to listen for user activity
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'wheel'
  ],
  
  // Routes that don't require session timeout
  PUBLIC_ROUTES: ['/login', '/register', '/'],
  
  // Enable/disable session timeout globally
  ENABLED: true,
  
  // Debug mode for development
  DEBUG: process.env.NODE_ENV === 'development'
};

// Helper functions
export const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  return `${remainingSeconds}s`;
};

export const isPublicRoute = (pathname) => {
  return SESSION_CONFIG.PUBLIC_ROUTES.includes(pathname);
};

export const log = (message, ...args) => {
  if (SESSION_CONFIG.DEBUG) {
    console.log(`[SessionTimeout] ${message}`, ...args);
  }
};