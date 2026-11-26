const express = require('express');
const router = express.Router();
const b2bController = require('../controllers/b2bController');

router.post('/inquiry', b2bController.submitInquiry);
router.get('/inquiries', b2bController.getInquiries);
router.put('/inquiries/:id/status', b2bController.updateInquiryStatus);

module.exports = router;
