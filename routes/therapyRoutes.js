const express = require('express');
const router = express.Router();
const therapyController = require('../controllers/therapyController');

router.get('/', therapyController.getAllTherapies);

module.exports = router;
