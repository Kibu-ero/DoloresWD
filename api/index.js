// Vercel serverless function entry point
const serverless = require('serverless-http');
const app = require('../backend/server');

// Wrap Express app for Vercel serverless functions
module.exports = serverless(app);

