// Vercel serverless function entry point
const serverless = require('serverless-http');

let app;
let handler;

try {
  app = require('../backend/server');
  handler = serverless(app, {
    binary: ['image/*', 'application/pdf'],
  });
} catch (error) {
  console.error('❌ Failed to initialize server:', error);
  // Return a handler that always returns 500
  handler = async (event, context) => {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Server initialization failed',
        message: error.message 
      }),
    };
  };
}

module.exports = handler;

