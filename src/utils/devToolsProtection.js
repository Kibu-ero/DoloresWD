// Basic protection against casual inspection
// Note: This cannot completely prevent code inspection, but it makes it harder for casual users

export const initDevToolsProtection = () => {
  // Only enable in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable common keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
  });

  // Detect DevTools opening (basic detection)
  let devtools = { open: false, orientation: null };
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Optionally redirect or show warning
        // window.location.href = '/';
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Clear console on load
  if (typeof console !== 'undefined') {
    console.clear();
  }
};
