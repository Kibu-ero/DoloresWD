import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./index.css";
// import { initDevToolsProtection } from './utils/devToolsProtection';

// Initialize basic DevTools protection in production
// initDevToolsProtection(); // Temporarily disabled

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
