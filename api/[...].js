// Vercel serverless function catch-all for all /api/* routes
const serverless = require('serverless-http');
const app = require('../backend/server');

// Wrap Express app for Vercel serverless functions
module.exports = serverless(app);

