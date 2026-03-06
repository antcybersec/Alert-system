const { analyzeMedia, analyzeText } = require('../services/aiService');
const axios = require('axios');
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

// ==========================================
// CONFIGURATION & UTILS
// ==========================================
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const WHAPI_URL = process.env.WHAPI_INSTANCE_URL;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

// Helper: Download Media with Smart Retry
async function downloadMedia(url) {
    try {
        if (!url) return null;
        if (url.startsWith('data:')) return url.split(',')[1];

        // Strategy 1: With Token (Whapi Standard)
        try {
            const config = { responseType: 'arraybuffer', timeout: 15000 };
            const isPublicTest = url.includes('placehold.co') || url.includes('via.placeholder.com');

            if (process.env.WHAPI_TOKEN && !isPublicTest) {
                config.headers = { Authorization: `Bearer ${process.env.WHAPI_TOKEN}` };
            }
            const response = await axios.get(url, config);
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (firstErr) {
            console.warn(`[Media] Token download failed. Retrying plain...`);

            // Strategy 2: Without Token (Pre-signed URLs)
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            return Buffer.from(response.data, 'binary').toString('base64');
        }
    } catch (finalErr) {
        console.error("Error downloading media:", finalErr.message);
        return null;
    }
}

// Helper: Send WhatsApp Message
const sendMessage = async (to, message) => {
    try {
        if (!to) return;
        console.log(`🤖 [BOT REPLY] To ${to}: "${message}"`); // Log the reply for debugging
        await axios.post(`${WHAPI_URL}/messages/text`, {
            to,
            body: message
        }, {
            headers: { Authorization: `Bearer ${WHAPI_TOKEN}`, "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("WhatsApp Send Error:", error.response?.data || error.message);
    }
};

// Helper: Download Meta Cloud Media
async function downloadMetaMedia(mediaId) {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        if (!token) return null;

        const urlRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const mediaRes = await axios.get(urlRes.data.url, {
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${token}` }
        });
        return Buffer.from(mediaRes.data, 'binary').toString('base64');
    } catch (e) {
        console.error("Meta Download Error:", e.message);
        return null;
    }
}

// ==========================================

/**
 * Asks the AI to generate a reply based on the context.
 * @param {Object} context - { type: 'media_analysis'|'text_reply', data: object, userName: string }
 */
// ==========================================
// NEW: NLP & HUMAN PERSONA ENGINE
// ==========================================

async function getSmartReplyFromAI(context) {
    const userName = context.userName || "Friend";

    // 1. Define the Persona (Dynamic)
    const botName = process.env.BOT_NAME || "Rahul";
    const appName = process.env.APP_NAME || "Nagar Alert";

    const systemInstruction = `
    You are "${botName}" from ${appName} 🚨.
    
    YOUR PERSONALITY:
    - Dedicated community volunteer.
    - Empathetic but efficient.
    - Uses mild Indian English/Hinglish (e.g., "Ji", "Don't worry").
    
    YOUR GOAL:
    1. Acknowledge the photo/issue immediately.
    2. Ask for the LOCATION if it's missing.
    
    RULES:
    - Keep it under 25 words.
    - NO generic "Hello/Welcome". Jump to the issue.
    - Example 1: "Pothole detected! looks dangerous. Where is this exactly?"
    - Example 2: "Garbage pile noted. Please share the location so we can clean it."
    `;

    // 2. Format Data for the AI
    let userContext = "";

    if (context.type === 'media_analysis') {
        const data = context.data;
        const locationFound = data.detectedLocation ? `Location detected: "${data.detectedLocation}"` : "NO Location found.";
        const mediaType = data.mediaType ? data.mediaType.toUpperCase() : 'PHOTO'; // Default to PHOTO

        userContext = `
        MEDIA_TYPE: ${mediaType}
        REPORT: ${data.issue} (${data.description})
        SEVERITY: ${data.priority}
        LOCATION_DATA: ${locationFound}
        
        TASK:
        - Acknowledge the ${mediaType}.
        - If Location is found: Confirm it ("Is this at [Location]?").
        - If Location is MISSING: Ask for it politely but urgently ("Please share the location").
        `;
    }
    else if (context.type === 'ask_name') {
        userContext = `User reported: ${context.data.issue}. We need their Name. Ask casually.`;
    }
    else if (context.type === 'report_success') {
        userContext = `
            Situation: Report verified for ${context.data.issue} at ${context.data.address}.
            Task: Send a formal but friendly confirmation. 
            Format exactly like this (fill in details):
            
            ✅ Location Saved: ${context.data.address}
            
            Report ID: #${Math.floor(Math.random() * 10000)}
            Status: ✅ Verified & Accepted
            
            (We have alerted the authorities)
            `;
    }
    else {
        // General Chat
        userContext = `User said: "${context.data.text}". Reply conversationally.`;
    }

    // 3. Generate Reply
    const aiService = require('../services/aiService');
    return await aiService.generateChatReply(systemInstruction, userContext);
}


// ==========================================
// MAIN WEBHOOK HANDLER
// ==========================================

async function processIncomingMessage(message, provider, metadata = {}) {
    let from, senderNumber;

    try {
        let type, body, mediaId, mimeTypeRaw, mediaUrl = null, locationData = null;

        // 1. Parse Provider Data
        if (provider === 'whapi') {
            senderNumber = (message.chat_id || message.from).split('@')[0];
            from = message.chat_id || message.from;
            type = message.type;
            body = message.text?.body || "";
            if (type === 'location') locationData = message.location;
        } else if (provider === 'meta') {
            senderNumber = message.from;
            from = message.from;
            type = message.type;
            if (type === 'text') body = message.text.body;
            else if (type === 'image') { mediaId = message.image.id; mimeTypeRaw = message.image.mime_type; }
            else if (type === 'video') { mediaId = message.video.id; mimeTypeRaw = message.video.mime_type; }
            else if (type === 'audio') { mediaId = message.audio.id; mimeTypeRaw = message.audio.mime_type; }
            else if (type === 'location') locationData = message.location;
        }

        console.log(`[MSG] From: ${senderNumber} | Type: ${type}`);

        // 2. Get User Profile
        const waUserRef = db.ref(`users/whatsapp_profiles/${senderNumber}`);
        const waUserSnap = await waUserRef.once('value');
        let waUserProfile = waUserSnap.val() || {};

        // 3. Check Pending Reports
        let pendingReport = null;
        const userReportsSnap = await db.ref('reports').orderByChild('userPhone').equalTo(senderNumber).once('value');

        if (userReportsSnap.exists()) {
            const reports = Object.values(userReportsSnap.val());
            reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latest = reports[0];

            if (['Draft_Waiting_Name', 'Draft_Waiting_Location', 'Pending Address'].includes(latest.status)
                && (new Date() - new Date(latest.createdAt) < 2 * 60 * 60 * 1000)) {
                pendingReport = latest;
            }
        }

        // ==========================================
        // SCENARIO A: TEXT MESSAGES
        // ==========================================
        if (type === 'text') {
            const text = body.trim();

            // A1. Handle Pending "Wait for Name"
            if (pendingReport && pendingReport.status === 'Draft_Waiting_Name') {
                await db.ref(`reports/${pendingReport.id}`).update({
                    userName: text,
                    status: 'Draft_Waiting_Location'
                });
                await waUserRef.update({ name: text, phone: senderNumber });

                // Re-fetch analysis to give context to AI
                const rSnap = await db.ref(`reports/${pendingReport.id}`).once('value');
                const analysis = rSnap.val().aiAnalysis ? JSON.parse(rSnap.val().aiAnalysis) : { issue: "Issue" };

                // GENERATE AI REPLY (Name provided, asking for Location)
                const aiReply = await getSmartReplyFromAI({
                    type: 'media_analysis', // Re-trigger the media analysis prompt but now we know the name
                    data: analysis,
                    userName: text
                });

                await sendMessage(from, aiReply);
                return;
            }

            // A2. Handle Pending "Wait for Location"
            if (pendingReport && (pendingReport.status === 'Draft_Waiting_Location' || pendingReport.status === 'Pending Address')) {
                const finalStatus = pendingReport.aiConfidence > 80 ? 'Verified' : 'Pending';

                const updates = {
                    'location/address': text,
                    status: finalStatus,
                    userName: waUserProfile.name || pendingReport.userName
                };

                await db.ref(`reports/${pendingReport.id}`).update(updates);
                await db.ref(`reports/by_department/${(pendingReport.department || 'General').replace(/[\/\.#\$\[\]]/g, "_")}/${pendingReport.id}`).update(updates);

                if (!waUserProfile.defaultAddress) await waUserRef.update({ defaultAddress: text });

                // GENERATE AI REPLY (Success)
                const successMsg = await getSmartReplyFromAI({
                    type: 'report_success',
                    data: { issue: pendingReport.type, address: text },
                    userName: waUserProfile.name
                });

                await sendMessage(from, successMsg);

                if (finalStatus === 'Verified') {
                    exports.broadcastTargetedAlert(text, `🚨 *New Alert: ${pendingReport.type}*\n📍 ${text}`);
                }
                return;
            }

            // A3. General Chat (AI GENERATED)
            // Instead of hardcoded "Hi/Hello", we send the user's text to the AI
            await sendMessage(from, "🤖..."); // Optional: Typing indicator

            const chatReply = await getSmartReplyFromAI({
                type: 'chat',
                data: { text: text },
                userName: waUserProfile.name
            });

            await sendMessage(from, chatReply);
            return;
        }

        // ==========================================
        // SCENARIO B: LOCATION MESSAGES
        // ==========================================
        if (type === 'location' && locationData) {
            // Handle Pending "Wait for Location"
            if (pendingReport && (pendingReport.status === 'Draft_Waiting_Location' || pendingReport.status === 'Pending Address')) {
                const lat = locationData.latitude;
                const long = locationData.longitude;
                // Whapi gives 'address', Meta might not, so we fallback
                const address = locationData.address || locationData.name || `${lat}, ${long}`;

                const finalStatus = pendingReport.aiConfidence >= 70 ? 'Verified' : 'Pending';
                console.log(`[Status Calc] Confidence: ${pendingReport.aiConfidence}, Final Status: ${finalStatus}`);

                const updates = {
                    'location/latitude': lat,
                    'location/longitude': long,
                    'location/address': address,
                    status: finalStatus,
                    userName: waUserProfile.name || pendingReport.userName
                };

                await db.ref(`reports/${pendingReport.id}`).update(updates);
                await db.ref(`reports/by_department/${(pendingReport.department || 'General').replace(/[\/\.#\$\[\]]/g, "_")}/${pendingReport.id}`).update(updates);

                if (!waUserProfile.defaultAddress) await waUserRef.update({ defaultAddress: address });

                // GENERATE AI REPLY (Success)
                const successMsg = await getSmartReplyFromAI({
                    type: 'report_success',
                    data: { issue: pendingReport.type, address: address },
                    userName: waUserProfile.name
                });

                await sendMessage(from, successMsg);

                if (finalStatus === 'Verified') {
                    exports.broadcastTargetedAlert(
                        address,
                        `🚨 *New Alert: ${pendingReport.type}*\n📍 ${address}`,
                        from // Pass current user to receive the simulated broadcast
                    );
                }
                return;
            } else {
                await sendMessage(from, "📍 Location received. Please send a photo of the issue first to start a report.");
                return;
            }
        }

        // ==========================================
        // SCENARIO C: MEDIA MESSAGES (NEW REPORT)
        // ==========================================
        if (['image', 'video', 'audio', 'voice'].includes(type)) {

            if (pendingReport) {
                await sendMessage(from, `⚠️ You have a pending report. Please finish that first.`);
                return;
            }

            await sendMessage(from, "🤖 *Analyzing Media...*");

            // 1. Download Media
            let mediaBase64 = null;
            if (provider === 'meta' && mediaId) mediaBase64 = await downloadMetaMedia(mediaId);
            else if (provider === 'whapi') {
                const link = (message.video?.link || message.video?.url) || (message.image?.link || message.image?.url) || (message.audio?.link || message.voice?.link);
                mediaUrl = link;
                mediaBase64 = await downloadMedia(link);
            }

            // 2. AI Analysis (Vision)
            let aiResult = { isReal: false };
            let mimeType = 'image/jpeg'; // Default

            if (mediaBase64) {
                const mimeMap = { image: 'image/jpeg', video: 'video/mp4', audio: 'audio/ogg', voice: 'audio/ogg' };
                mimeType = mimeTypeRaw || mimeMap[type] || 'application/octet-stream';
                aiResult = await analyzeMedia(mediaBase64, mimeType);
            } else {
                aiResult = { isReal: true, issue: "Report (Media Pending)", description: "Processing...", category: "General", priority: "Medium", confidence: 100 };
            }

            if (!aiResult.isReal) {
                await sendMessage(from, `❌ AI could not verify this issue. Please send a clear photo.`);
                return;
            }

            const reportId = uuidv4();

            // 3. Upload to Firebase Storage (Avoid saving Base64 in DB)
            let publicMediaUrl = mediaUrl || "Pending";
            if (mediaBase64) {
                try {
                    const { uploadBase64Media } = require('../services/storageService');
                    publicMediaUrl = await uploadBase64Media(mediaBase64, mimeType, reportId);
                    console.log(`[Storage] Uploaded media to: ${publicMediaUrl}`);
                } catch (uploadErr) {
                    console.error("[Storage] Upload failed, falling back to basic URL:", uploadErr);
                }
            }

            // 4. Save to DB
            await db.ref(`reports/${reportId}`).set({
                id: reportId,
                type: aiResult.issue,
                description: aiResult.description,
                category: aiResult.category,
                priority: aiResult.priority,
                imageUrl: publicMediaUrl, // Using Storage URL
                mediaType: type, // Store type (video, audio, etc)
                status: waUserProfile.name ? 'Draft_Waiting_Location' : 'Draft_Waiting_Name',
                aiConfidence: aiResult.confidence,
                aiAnalysis: JSON.stringify(aiResult),
                createdAt: new Date().toISOString(),
                userPhone: senderNumber,
                userName: waUserProfile.name || null
            });

            // 5. GENERATE AI REPLY
            // If we don't know the name, ask for name
            if (!waUserProfile.name) {
                const namePrompt = await getSmartReplyFromAI({
                    type: 'ask_name',
                    data: { issue: aiResult.issue },
                    userName: null
                });
                await sendMessage(from, namePrompt);
            } else {
                // If we know name, generate full analysis response
                const analysisReply = await getSmartReplyFromAI({
                    type: 'media_analysis',
                    data: { ...aiResult, mediaType: type },
                    userName: waUserProfile.name
                });
                await sendMessage(from, analysisReply);
            }
        }

    } catch (e) {
        console.error("Fatal Handler Error:", e);
        if (from) await sendMessage(from, "⚠️ System Error.");
    }
}

// ==========================================
// EXPORTS
// ==========================================

exports.handleWebhook = async (req, res) => {
    try {
        const body = req.body;
        if (body.messages) {
            for (const msg of body.messages) {
                if (msg.from_me) continue;
                await processIncomingMessage(msg, 'whapi');
            }
        } else if (body.object === 'whatsapp_business_account' && body.entry) {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value?.messages) {
                        for (const msg of change.value.messages) {
                            await processIncomingMessage(msg, 'meta', change.value.metadata);
                        }
                    }
                }
            }
        }
        res.send('OK');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Error");
    }
};

exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === (process.env.WEBHOOK_VERIFY_TOKEN || 'nagar_alert_verify_token')) {
        return res.status(200).send(challenge);
    }
    res.status(403).send('Verification failed');
};

exports.sendManualBroadcast = async (req, res) => {
    try {
        const { area, message, type } = req.body;
        await exports.broadcastTargetedAlert(area, `📢 *${type?.toUpperCase() || 'ALERT'}*\n📍 Area: ${area}\n\n${message}`);
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.broadcastTargetedAlert = async (targetLocation, message, simulatedReceiver = null) => {
    console.log(`[Broadcast System] 📡 Searching for users in area: ${targetLocation}`);

    try {
        const usersToNotify = new Set();
        const emailsToNotify = new Set();

        if (simulatedReceiver) {
            if (simulatedReceiver.includes('@')) usersToNotify.add(simulatedReceiver.split('@')[0]);
            else usersToNotify.add(simulatedReceiver);
        }

        // 1. Fetch WhatsApp registered users
        const waProfilesSnap = await db.ref('users/whatsapp_profiles').once('value');
        if (waProfilesSnap.exists()) {
            const profiles = waProfilesSnap.val();
            Object.values(profiles).forEach(user => {
                const userLoc = (user.defaultAddress || "").toLowerCase();
                const target = targetLocation.toLowerCase();
                if (userLoc.includes(target) || target.includes(userLoc)) {
                    usersToNotify.add(user.phone);
                    if (user.email) emailsToNotify.add(user.email);
                }
            });
        }

        // 2. Fetch Registry users (broadcast_list & registry)
        const registrySnap = await db.ref('users/registry').once('value');
        if (registrySnap.exists()) {
            const list = registrySnap.val();
            Object.values(list).forEach(user => {
                const userLoc = (user.address || "").toLowerCase();
                const target = targetLocation.toLowerCase();
                if (userLoc.includes(target) || target.includes(userLoc)) {
                    if (user.mobile) usersToNotify.add(user.mobile.replace(/\D/g, ''));
                    if (user.email) emailsToNotify.add(user.email);
                }
            });
        }

        console.log(`[Broadcast System] Found ${usersToNotify.size} WhatsApp targets and ${emailsToNotify.size} Email targets in/near ${targetLocation}`);

        // 3. Send WhatsApp Messages
        for (const phone of usersToNotify) {
            const target = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
            await sendMessage(target, message);
        }

        // 4. Send Email Alerts
        if (emailsToNotify.size > 0) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #d9534f 0%, #c9302c 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">🚨 OFFICIAL CIVIC ALERT</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Nagar Alert Hub | Emergency Broadcast</p>
                    </div>
                    <div style="padding: 30px; background: #ffffff; color: #333333; line-height: 1.6;">
                        <p style="font-size: 18px; margin-top: 0;"><strong>Active Incident in ${targetLocation}</strong></p>
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                        <div style="background: #fff5f5; border-left: 4px solid #d9534f; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
                            <p style="margin: 0; white-space: pre-wrap;">${message.replace(/📢|🚨|📍|⚠️|✅/g, '')}</p>
                        </div>
                        <p style="font-size: 14px; color: #666;">This alert was sent automatically based on your registered location. Please stay safe and follow official instructions.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://nagaralert.vercel.app" style="background: #333; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Live Dashboard</a>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eeeeee;">
                        &copy; 2026 Nagar Alert Ranchi Hackathon Team SYNC. All rights reserved.
                    </div>
                </div>
            `;

            for (const email of emailsToNotify) {
                try {
                    await transporter.sendMail({
                        from: '"Nagar Alert Hub" <hacksindiaranchi@gmail.com>',
                        to: email,
                        subject: `🚨 CIVIC ALERT: ${targetLocation}`,
                        html: emailHtml
                    });
                    console.log(`[Broadcast System] 📧 Email sent to: ${email}`);
                } catch (emailErr) {
                    console.error(`[Broadcast System] Email failure for ${email}:`, emailErr.message);
                }
            }
        }

        // 5. Save to Dashboard History (broadcasts node)
        try {
            await db.ref('broadcasts').push({
                area: targetLocation,
                type: 'Automated Multi-Channel Alert',
                message: message,
                sender: 'System Bot',
                reach: usersToNotify.size + emailsToNotify.size,
                status: 'Sent',
                timestamp: new Date().toISOString()
            });
        } catch (dbErr) {
            console.error("[Broadcast System] History Save Failed:", dbErr.message);
        }

        return usersToNotify.size + emailsToNotify.size;
    } catch (e) {
        console.error("[Broadcast System] Fatal Error:", e.message);
        return 0;
    }
};

module.exports = exports;