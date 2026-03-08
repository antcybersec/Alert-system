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

// Optional: when set, replies are pushed here instead of sending (for /simulate)
let replyCollector = null;

// Helper: Send WhatsApp Message (or collect reply when replyCollector is set)
const sendMessage = async (to, message) => {
    if (!to) return;
    console.log(`🤖 [BOT REPLY] To ${to}: "${message.substring(0, 80)}..."`);
    if (replyCollector) {
        replyCollector.push(message);
        return;
    }
    if (!WHAPI_URL || !WHAPI_TOKEN) {
        console.warn("⚠️ WhatsApp API not configured (WHAPI_URL/WHAPI_TOKEN missing in .env). Reply not sent.");
        return;
    }
    try {
        const toNumber = String(to).replace(/\D/g, '');
        const payload = { body: message, to: toNumber || to };
        const url = `${WHAPI_URL.replace(/\/$/, '')}/messages/text`;
        console.log("[Whapi] POST", url, "| to:", payload.to);
        const resp = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${WHAPI_TOKEN}`, "Content-Type": "application/json" }
        });
        console.log("[Whapi] Send OK", resp.status, resp.data ? JSON.stringify(resp.data).substring(0, 100) : "");
    } catch (error) {
        console.error("WhatsApp Send Error:", error.response?.status, error.response?.data || error.message);
    }
};

// ==========================================
// GUIDED FLOW: Hi → Language → Location → Photo → Thank you
// ==========================================
const FLOW_STATE = { IDLE: 'idle', AWAITING_LANGUAGE: 'awaiting_language', AWAITING_LOCATION: 'awaiting_location', AWAITING_PHOTO: 'awaiting_photo' };

const FLOW_MESSAGES = {
    en: {
        askLanguage: "Welcome to Nagar Alert! 🚨\n\nPlease choose your language:\n*1.* English\n*2.* Hindi",
        askLocation: "Please share your *location* (use the 📎 attachment button and choose Location).",
        askPhoto: "Thank you! Now please send a *photo* of the issue (pothole, garbage, etc.).",
        thankYou: "✅ *Thank you!*\n\nYour picture and location have been received and sent to your nearest authorities. We will look into it shortly."
    },
    hi: {
        askLanguage: "Nagar Alert में आपका स्वागत है! 🚨\n\nकृपया अपनी भाषा चुनें:\n*1.* English\n*2.* Hindi",
        askLocation: "कृपया अपना *लोकेशन* भेजें (📎 अटैचमेंट बटन से Location चुनें)।",
        askPhoto: "धन्यवाद! अब कृपया समस्या की *फोटो* भेजें (गड्ढा, कचरा आदि)।",
        thankYou: "✅ *धन्यवाद!*\n\nआपकी फोटो और लोकेशन प्राप्त हो गई है और आपके नज़दीकी अधिकारियों को भेज दी गई है। जल्द ही कार्रवाई की जाएगी।"
    }
};

// In-memory state when Firebase is not available
const memoryState = new Map();

async function getFlowState(senderNumber) {
    if (db) {
        try {
            const snap = await db.ref(`users/whatsapp_profiles/${senderNumber}`).once('value');
            const profile = snap.val() || {};
            const s = profile.conversationState;
            if (s && s !== FLOW_STATE.IDLE) return { conversationState: s, conversationLanguage: profile.conversationLanguage || 'en', pendingLocation: profile.pendingLocation || null };
        } catch (e) { /* ignore */ }
    }
    const mem = memoryState.get(senderNumber);
    return mem && mem.conversationState !== FLOW_STATE.IDLE ? mem : null;
}

async function setFlowState(senderNumber, state) {
    const toStore = { conversationState: state.conversationState, conversationLanguage: state.conversationLanguage || 'en', pendingLocation: state.pendingLocation || null };
    if (db) {
        try {
            await db.ref(`users/whatsapp_profiles/${senderNumber}`).update(toStore);
        } catch (e) {
            console.warn("[Flow] Firebase update failed, using memory:", e.message);
        }
    }
    memoryState.set(senderNumber, toStore);
}

async function clearFlowState(senderNumber) {
    const idle = { conversationState: FLOW_STATE.IDLE, conversationLanguage: 'en', pendingLocation: null };
    if (db) {
        try {
            await db.ref(`users/whatsapp_profiles/${senderNumber}`).update(idle);
        } catch (e) { /* ignore */ }
    }
    memoryState.delete(senderNumber);
}

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
            const chatId = message.chat_id || message.from;
            senderNumber = (typeof chatId === 'string' ? chatId : '').split('@')[0].replace(/\D/g, '') || String(message.from || '').replace(/\D/g, '');
            from = chatId || message.from;
            type = message.type || 'text';
            body = (message.text && message.text.body) ? message.text.body : (message.body != null ? message.body : '');
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

        // ----- GUIDED FLOW: Hi → Language → Location → Photo → Thank you -----
        const flowState = await getFlowState(senderNumber);
        const lang = (flowState && flowState.conversationLanguage) || 'en';
        const msgs = FLOW_MESSAGES[lang] || FLOW_MESSAGES.en;

        if (type === 'text') {
            const text = (body || '').trim().toLowerCase();
            console.log("[Flow] Text received:", JSON.stringify(text), "| flowState:", flowState?.conversationState || "none");
            if ((text === 'hi' || text === 'hello' || text === 'start' || text === 'हैलो') && !flowState) {
                console.log("[Flow] Matched Hi/Hello/Start → sending language choice");
                await setFlowState(senderNumber, { conversationState: FLOW_STATE.AWAITING_LANGUAGE, conversationLanguage: 'en', pendingLocation: null });
                await sendMessage(from, FLOW_MESSAGES.en.askLanguage);
                return;
            }
            if (flowState && flowState.conversationState === FLOW_STATE.AWAITING_LANGUAGE) {
                const newLang = /^(2|hindi|हिंदी)$/.test(text) ? 'hi' : 'en';
                await setFlowState(senderNumber, { conversationState: FLOW_STATE.AWAITING_LOCATION, conversationLanguage: newLang, pendingLocation: null });
                await sendMessage(from, FLOW_MESSAGES[newLang].askLocation);
                return;
            }
            if (flowState && flowState.conversationState === FLOW_STATE.AWAITING_LOCATION) {
                await sendMessage(from, lang === 'hi' ? 'कृपया 📎 अटैचमेंट से *Location* भेजें।' : 'Please send your *location* using the 📎 attachment button.');
                return;
            }
            if (flowState && flowState.conversationState === FLOW_STATE.AWAITING_PHOTO) {
                await sendMessage(from, msgs.askPhoto);
                return;
            }
        }

        if (type === 'location' && locationData && flowState && flowState.conversationState === FLOW_STATE.AWAITING_LOCATION) {
            const lat = locationData.latitude;
            const lng = locationData.longitude;
            const address = locationData.address || locationData.name || `${lat}, ${lng}`;
            await setFlowState(senderNumber, { conversationState: FLOW_STATE.AWAITING_PHOTO, conversationLanguage: lang, pendingLocation: { latitude: lat, longitude: lng, address } });
            await sendMessage(from, msgs.askPhoto);
            return;
        }

        if (['image', 'video'].includes(type) && flowState && flowState.conversationState === FLOW_STATE.AWAITING_PHOTO) {
            const pendingLoc = flowState.pendingLocation || {};
            await sendMessage(from, "📷 " + (lang === 'hi' ? "फोटो प्राप्त हो रही है..." : "Receiving photo..."));
            let mediaBase64 = null;
            if (provider === 'meta' && (message.image?.id || message.video?.id)) {
                const mid = message.image?.id || message.video?.id;
                mediaBase64 = await downloadMetaMedia(mid);
            } else if (provider === 'whapi') {
                const link = (message.video?.link || message.video?.url) || (message.image?.link || message.image?.url);
                mediaBase64 = link ? await downloadMedia(link) : null;
            }
            const reportId = uuidv4();
            if (db) {
                try {
                    let publicMediaUrl = 'Pending';
                    if (mediaBase64) {
                        try {
                            const { uploadBase64Media } = require('../services/storageService');
                            const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
                            publicMediaUrl = await uploadBase64Media(mediaBase64, mimeType, reportId);
                        } catch (_) { /* ignore */ }
                    }
                    await db.ref(`reports/${reportId}`).set({
                        id: reportId,
                        type: 'Civic Issue',
                        description: 'Report via guided WhatsApp flow',
                        category: 'General',
                        priority: 'Medium',
                        imageUrl: publicMediaUrl,
                        status: 'Verified',
                        location: { latitude: pendingLoc.latitude, longitude: pendingLoc.longitude, address: pendingLoc.address },
                        createdAt: new Date().toISOString(),
                        userPhone: senderNumber,
                        userLocation: pendingLoc.address
                    });
                } catch (e) {
                    console.warn("[Flow] Report save failed:", e.message);
                }
            }
            await clearFlowState(senderNumber);
            await sendMessage(from, msgs.thankYou);
            return;
        }

        // 2. Get User Profile (existing logic)
        const waUserRef = db && db.ref ? db.ref(`users/whatsapp_profiles/${senderNumber}`) : null;
        let waUserProfile = {};
        if (waUserRef) {
            try {
                const waUserSnap = await waUserRef.once('value');
                waUserProfile = waUserSnap.val() || {};
            } catch (e) { /* ignore */ }
        }

        // 3. Check Pending Reports (only when DB available)
        let pendingReport = null;
        if (db) {
            try {
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
            } catch (e) { /* ignore */ }
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
        const body = req.body || {};
        const messages = body.messages || body.data?.messages || [];
        console.log("[Webhook] Received. Keys:", Object.keys(body).join(", "), "| Messages count:", messages.length);
        if (messages.length > 0) {
            const msg = messages[0];
            console.log("[Webhook] First message: type=", msg.type, "| from_me=", msg.from_me, "| text=", (msg.text?.body || msg.body || "").substring(0, 50));
        }
        if (messages.length > 0) {
            for (const msg of messages) {
                if (msg.from_me) {
                    console.log("[Webhook] Skipping from_me message");
                    continue;
                }
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

/**
 * Simulate a message and return the bot reply (for in-app WhatsApp simulator).
 * POST body: { message: "Hi", type?: "text"|"location", senderNumber?: "919999999999", location?: { latitude, longitude, address } }
 */
exports.simulate = async (req, res) => {
    const replies = [];
    replyCollector = replies;
    try {
        const { message, type = 'text', senderNumber = '919999999999', location } = req.body || {};
        const chatId = `${String(senderNumber).replace(/\D/g, '')}@s.whatsapp.net`;
        const fakeMsg = type === 'location' && location
            ? { chat_id: chatId, from: senderNumber, type: 'location', location }
            : { chat_id: chatId, from: senderNumber, type: 'text', text: { body: String(message || '') } };
        await processIncomingMessage(fakeMsg, 'whapi');
        res.json({ success: true, replies });
    } catch (e) {
        console.error("[Simulate] Error:", e);
        res.status(500).json({ success: false, error: e.message, replies: replyCollector ? [...replyCollector] : [] });
    } finally {
        replyCollector = null;
    }
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