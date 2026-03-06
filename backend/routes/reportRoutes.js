const express = require('express');
const router = express.Router();
console.log("✅ [DEBUG] reportRoutes.js LOADED");
const {
    verifyReportImage,
    createReport,
    getUserReports,
    getSingleReport,
    getDepartmentReports,
    getAllReports,
    updateReportStatus,
    sendBroadcast,
    getNearbyReports,
    detectLocationFromText
} = require('../controllers/reportController');

router.get('/test', (req, res) => {
    console.log("[DEBUG] /api/reports/test HIT");
    res.json({ message: "Reports Route Working" });
});

router.post('/verify-image', verifyReportImage);
router.post('/detect-location', detectLocationFromText);
router.post('/create', createReport);
router.post('/update-status', updateReportStatus);
router.post('/broadcast', sendBroadcast);
router.get('/user/:uid', getUserReports);
router.get('/department/:department', getDepartmentReports);
router.get('/nearby', getNearbyReports);
// NEW: Get ALL reports (Global View)
router.get('/', getAllReports);
router.get('/:id', getSingleReport);

module.exports = router;