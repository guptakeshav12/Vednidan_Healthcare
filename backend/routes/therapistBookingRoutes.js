const express = require('express');
const router = express.Router();
const therapistBookingController = require('../controllers/therapistBookingController');

router.get('/therapists', therapistBookingController.getTherapists);
router.get('/slots', therapistBookingController.getAvailableSlots);
router.post('/book', therapistBookingController.bookSession);
router.post('/feedback', therapistBookingController.submitPatientFeedback);

module.exports = router;
