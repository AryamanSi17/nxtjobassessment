import { serve } from '@hono/node-server';
import app from './app'; // Import the Hono app

// Start the server on port 3000
serve({
  fetch: app.fetch,
  port: 3000,
});

console.log('Server running on http://localhost:3000');
