const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Create automatic alert (triggered when report is accepted)
router.post('/auto', alertController.createAutoAlert);

// Create manual alert (admin broadcast)
router.post('/broadcast', alertController.createManualAlert);

// Get all active alerts
router.get('/active', alertController.getActiveAlerts);

// Dismiss alert for user
router.post('/dismiss', alertController.dismissAlert);

// Increment view count
router.post('/view', alertController.incrementViewCount);

console.log('✅ [DEBUG] alertRoutes.js LOADED');

module.exports = router;
