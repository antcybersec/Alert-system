const express = require('express');
const router = express.Router();
const { handleWebhook, verifyWebhook } = require('../controllers/whatsappController');

// Webhook endpoint for WhatsApp (Whapi or Meta Cloud API)
router.post('/webhook', handleWebhook);

// Verification endpoint for Meta Cloud API
router.get('/webhook', verifyWebhook);

module.exports = router;