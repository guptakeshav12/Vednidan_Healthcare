const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

module.exports = router;
