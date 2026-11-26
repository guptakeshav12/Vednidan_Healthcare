require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const net = require('net');

// ============================
// Route imports
// ============================
const productRoutes = require('./routes/productRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const therapyRoutes = require('./routes/therapyRoutes');
const therapistBookingRoutes = require('./routes/therapistBookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const providerRoutes = require('./routes/providerRoutes');
const b2bRoutes = require('./routes/b2bRoutes');
// RAZORPAY_DISABLED: Uncomment line below to re-enable Razorpay payment routes in future
// const paymentRoutes = require('./routes/paymentRoutes');

// ============================
// App setup
// ============================
const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_DIR = path.join(__dirname, '../frontend');

// Enable CORS for all origins (needed when frontend runs on a different port)
app.use(cors());

// Body parser middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure required directories exist
[path.join(FRONTEND_DIR, 'assets'), path.join(__dirname, 'uploads'), path.join(__dirname, 'data')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
app.use('/api/provider', providerRoutes);
app.use('/api/b2b', b2bRoutes);
// RAZORPAY_DISABLED: Uncomment line below to re-enable Razorpay API endpoint in future
// app.use('/api/payment', paymentRoutes);

// ============================
// Serve static frontend files
// ============================
app.use(express.static(FRONTEND_DIR));

// Explicit clean routes for Admin and Provider portals
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

app.get(['/provider', '/provider.html', '/doctor-login', '/therapist-login'], (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'provider.html'));
});

// Catch-all: serve index.html for SPA routing (must be LAST route)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message || err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ============================
// Smart Server Startup
// Handles EADDRINUSE gracefully
// ============================
function startServer(port) {
  const numPort = parseInt(port, 10); // Always ensure numeric
  const server = app.listen(numPort, () => {
    console.log('');
    console.log('==================================================');
    console.log(' VedNidan Healthcare Server Running Successfully');
    console.log(` Local Server:   http://localhost:${numPort}`);
    console.log(` Admin Panel:    http://localhost:${numPort}/admin`);
    console.log(` Provider App:   http://localhost:${numPort}/provider.html`);
    console.log(` Current Time:   ${new Date().toLocaleString('en-IN')}`);
    console.log('==================================================');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = numPort + 1;
      console.log(`\n⚠️  Port ${numPort} is already in use.`);
      console.log(`   Trying port ${nextPort} instead...\n`);
      startServer(nextPort);
    } else {
      console.error('Server startup error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
