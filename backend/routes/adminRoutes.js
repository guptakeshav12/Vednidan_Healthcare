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

module.exports = router;
