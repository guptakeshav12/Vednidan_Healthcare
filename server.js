const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const productRoutes = require('./routes/productRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const therapyRoutes = require('./routes/therapyRoutes');
const therapistBookingRoutes = require('./routes/therapistBookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure public/assets folder exists
const assetsDir = path.join(__dirname, 'public/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api/products', productRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/therapies', therapyRoutes);
app.use('/api/therapist-booking', therapistBookingRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all route to serve index.html for client-side SPA routing (optional, but good practice)
app.get('*', (req, res, next) => {
  // If the request starts with /api, pass it to other handlers (it will 404 since it wasn't caught by the mounted routes)
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express server error:', err.stack || err);
  res.status(500).json({ 
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` VedNidan Healthcare Server Running Successfully`);
  console.log(` Local Server:   http://localhost:${PORT}`);
  console.log(` Current Time:   ${new Date().toISOString()}`);
  console.log(`==================================================`);
});
