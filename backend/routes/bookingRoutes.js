const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/doctors', bookingController.getDoctors);
router.get('/slots', bookingController.getAvailableSlots);
router.post('/book', bookingController.bookConsultation);

module.exports = router;
