const admin = require('firebase-admin');
const db = admin.database();
const { generateCivicAlert } = require('../services/alertService');

/**
 * Create and broadcast an alert automatically when a report is accepted
 */
exports.createAutoAlert = async (req, res) => {
    const { reportId } = req.body;

    try {
        // Get report data
        const reportRef = db.ref(`reports/${reportId}`);
        const reportSnapshot = await reportRef.once('value');
        const reportData = reportSnapshot.val();

        if (!reportData) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Generate AI alert
        const { alert } = await generateCivicAlert(reportData);

        // Create alert in database
        const alertsRef = db.ref('alerts');
        const newAlertRef = alertsRef.push();
        const alertId = newAlertRef.key;

        const alertObject = {
            id: alertId,
            reportId: reportId,
            emoji: alert.emoji,
            title: alert.title,
            message: alert.message,
            urgency: alert.urgency,
            category: alert.category,
            affectedArea: alert.affectedArea,
            estimatedTime: alert.estimatedTime,
            department: reportData.department,
            location: reportData.location,
            createdAt: new Date().toISOString(),
            createdBy: 'system',
            status: 'active',
            viewCount: 0,
            dismissedBy: []
        };

        await newAlertRef.set(alertObject);

        console.log(`[AUTO ALERT] Created alert ${alertId} for report ${reportId}`);

        res.status(201).json({
            message: 'Alert created successfully',
            alert: alertObject
        });

    } catch (error) {
        console.error('[AUTO ALERT ERROR]:', error);
        res.status(500).json({ error: 'Failed to create alert', details: error.message });
    }
};

/**
 * Create manual alert from admin broadcast
 */
exports.createManualAlert = async (req, res) => {
    const { reportId, customMessage } = req.body;

    try {
        // Get report data
        const reportRef = db.ref(`reports/${reportId}`);
        const reportSnapshot = await reportRef.once('value');
        const reportData = reportSnapshot.val();

        if (!reportData) {
            return res.status(404).json({ error: 'Report not found' });
        }

        let alertData;

        if (customMessage) {
            // Use custom message from admin
            const emoji = reportData.type?.toLowerCase().includes('pothole') ? '🚧' :
                reportData.type?.toLowerCase().includes('fire') ? '🔥' :
                    reportData.type?.toLowerCase().includes('water') ? '💧' :
                        reportData.type?.toLowerCase().includes('garbage') ? '🗑️' : '⚠️';

            alertData = {
                emoji: emoji,
                title: reportData.type || 'Civic Alert',
                message: customMessage,
                urgency: reportData.priority === 'High' ? 'high' : 'medium',
                category: reportData.department?.toLowerCase() || 'general',
                affectedArea: reportData.location?.address || 'Unknown',
                estimatedTime: null
            };
        } else {
            // Generate AI alert
            const { alert } = await generateCivicAlert(reportData);
            alertData = alert;
        }

        // Create alert in database
        const alertsRef = db.ref('alerts');
        const newAlertRef = alertsRef.push();
        const alertId = newAlertRef.key;

        const alertObject = {
            id: alertId,
            reportId: reportId,
            emoji: alertData.emoji,
            title: alertData.title,
            message: alertData.message,
            urgency: alertData.urgency,
            category: alertData.category,
            affectedArea: alertData.affectedArea,
            estimatedTime: alertData.estimatedTime,
            department: reportData.department,
            location: reportData.location,
            createdAt: new Date().toISOString(),
            createdBy: req.body.adminId || 'admin',
            status: 'active',
            viewCount: 0,
            dismissedBy: []
        };

        await newAlertRef.set(alertObject);

        console.log(`[MANUAL ALERT] Created alert ${alertId} for report ${reportId}`);

        res.status(201).json({
            message: 'Alert broadcast successfully',
            alert: alertObject
        });

    } catch (error) {
        console.error('[MANUAL ALERT ERROR]:', error);
        res.status(500).json({ error: 'Failed to broadcast alert', details: error.message });
    }
};

/**
 * Get all active alerts
 */
exports.getActiveAlerts = async (req, res) => {
    try {
        const alertsRef = db.ref('alerts');
        const snapshot = await alertsRef.orderByChild('status').equalTo('active').once('value');

        const alerts = [];
        snapshot.forEach(child => {
            alerts.push(child.val());
        });

        // Sort by createdAt (newest first)
        alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ alerts });

    } catch (error) {
        console.error('[GET ALERTS ERROR]:', error);
        res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
    }
};

/**
 * Dismiss an alert for a user
 */
exports.dismissAlert = async (req, res) => {
    const { alertId, userId } = req.body;

    try {
        const alertRef = db.ref(`alerts/${alertId}`);
        const snapshot = await alertRef.once('value');
        const alert = snapshot.val();

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const dismissedBy = alert.dismissedBy || [];
        if (!dismissedBy.includes(userId)) {
            dismissedBy.push(userId);
            await alertRef.update({ dismissedBy });
        }

        res.status(200).json({ message: 'Alert dismissed' });

    } catch (error) {
        console.error('[DISMISS ALERT ERROR]:', error);
        res.status(500).json({ error: 'Failed to dismiss alert', details: error.message });
    }
};

/**
 * Increment view count
 */
exports.incrementViewCount = async (req, res) => {
    const { alertId } = req.body;

    try {
        const alertRef = db.ref(`alerts/${alertId}`);
        const snapshot = await alertRef.once('value');
        const alert = snapshot.val();

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        await alertRef.update({ viewCount: (alert.viewCount || 0) + 1 });

        res.status(200).json({ message: 'View count updated' });

    } catch (error) {
        console.error('[INCREMENT VIEW ERROR]:', error);
        res.status(500).json({ error: 'Failed to update view count', details: error.message });
    }
};
