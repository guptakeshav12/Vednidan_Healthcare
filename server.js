// Root entrypoint forwarding to backend/server.js for hosting platforms (Render, Heroku, Railway, Vercel)
// This ensures require('./routes/productRoutes') correctly resolves relative to backend directory.
require('./backend/server.js');

