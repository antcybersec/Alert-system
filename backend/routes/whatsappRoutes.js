const express = require('express');
const router = express.Router();
const { handleWebhook, verifyWebhook, simulate } = require('../controllers/whatsappController');

// Webhook endpoint for WhatsApp (Whapi or Meta Cloud API)
router.post('/webhook', handleWebhook);

// Verification endpoint for Meta Cloud API
router.get('/webhook', verifyWebhook);

// Simulate message and get bot reply (for in-app simulator)
router.post('/simulate', simulate);

module.exports = router;