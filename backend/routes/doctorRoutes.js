const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.post('/chat', doctorController.consultDoctor);

module.exports = router;
