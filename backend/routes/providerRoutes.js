const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');

// Auth routes
router.post('/signup',          providerController.signup);
router.post('/login',           providerController.login);
router.post('/forgot-password', providerController.forgotPassword);
router.post('/reset-password',  providerController.resetPassword);
router.post('/change-password', providerController.changePassword);

// Booking management routes
router.get('/bookings',                         providerController.getBookings);
router.put('/doctor/booking/:id',               providerController.updateDoctorBooking);
router.put('/therapist/booking/:id',            providerController.updateTherapistBooking);

module.exports = router;
