const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const adminController = require('../controllers/adminController');

// ── Product image upload setup ──────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, '../../frontend');
const imgUploadDir = path.join(FRONTEND_DIR, 'assets', 'products');
if (!fs.existsSync(imgUploadDir)) fs.mkdirSync(imgUploadDir, { recursive: true });

const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imgUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'product-' + Date.now() + ext);
  }
});
const imgUpload = multer({
  storage: imgStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|webp|avif/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Product image upload endpoint
router.post('/upload-product-image', imgUpload.single('productImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const relPath = `/assets/products/${req.file.filename}`;
  res.json({ success: true, imageUrl: relPath });
});

// Stats endpoint
router.get('/stats', adminController.getStats);

// Orders endpoints
router.get('/orders', adminController.getOrders);
router.post('/orders', adminController.createOrder);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Products CRUD endpoints
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Bookings management
router.get('/bookings', adminController.getBookings);
router.delete('/bookings/:id', adminController.deleteBooking);

// Therapist bookings management
router.get('/therapist-bookings', adminController.getTherapistBookings);
router.delete('/therapist-bookings/:id', adminController.deleteTherapistBooking);

// NEW: Customers list & Order histories
router.get('/users', adminController.getUsersList);

// NEW: Monthly revenue & bestseller analytics
router.get('/analytics', adminController.getAnalytics);

// NEW: Doctors CRUD management
router.get('/doctors', adminController.getDoctors);
router.post('/doctors', adminController.addDoctor);
router.put('/doctors/:id', adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);

// NEW: Therapists CRUD management
router.get('/therapists', adminController.getTherapists);
router.post('/therapists', adminController.addTherapist);
router.put('/therapists/:id', adminController.updateTherapist);
router.delete('/therapists/:id', adminController.deleteTherapist);

// NEW: Partner Accounts management
router.get('/provider-accounts', adminController.getProviderAccounts);
router.put('/provider-accounts/:id/reset-password', adminController.resetProviderPassword);
router.delete('/provider-accounts/:id', adminController.deleteProviderAccount);

// NEW: AI Consultation Logs
router.get('/consultation-logs', adminController.getConsultationLogs);

// NEW: System Settings & Default Credentials
router.get('/settings', adminController.getSystemSettings);

module.exports = router;

