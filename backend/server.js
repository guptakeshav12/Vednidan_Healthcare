require('dotenv').config();
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
const FRONTEND_DIR = path.join(__dirname, '../frontend');

// Enable CORS for all origins (needed if frontend is on different port)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure required directories exist
const dirsToCreate = [
  path.join(FRONTEND_DIR, 'assets'),
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'data')
];
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================
// Mount API routes FIRST
// ============================
app.use('/api/products', productRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/therapies', therapyRoutes);
app.use('/api/therapist-booking', therapistBookingRoutes);
app.use('/api/admin', adminRoutes);

// ============================
// Serve static frontend files
// ============================
app.use(express.static(FRONTEND_DIR));

// Explicit route for admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

// Catch-all route to serve index.html for SPA routing (must be LAST)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Express server error:', err.stack || err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` VedNidan Healthcare Server Running Successfully`);
  console.log(` Local Server:   http://localhost:${PORT}`);
  console.log(` Admin Panel:    http://localhost:${PORT}/admin`);
  console.log(` Current Time:   ${new Date().toLocaleString('en-IN')}`);
  console.log(`==================================================\n`);
});
