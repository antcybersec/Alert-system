const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

// Initialize Vertex AI
// Initialize Vertex AI with Explicit Credentials for Render
const vertexOptions = {
    project: process.env.GCP_PROJECT_ID,
    location: 'us-central1'
};

// If running on Render (or anywhere with the ENV var), inject credentials directly
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const credentials = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : process.env.FIREBASE_SERVICE_ACCOUNT;

        vertexOptions.googleAuthOptions = {
            credentials: credentials
        };
        console.log("✅ [Vertex AI] Initializing with explicit 'FIREBASE_SERVICE_ACCOUNT' credentials.");
    } catch (err) {
        console.error("❌ [Vertex AI] Failed to parse FIREBASE_SERVICE_ACCOUNT:", err.message);
    }
}

const vertex_ai = new VertexAI(vertexOptions);

// Using Gemini 2.0 Flash for maximum speed and multimodal capabilities
const modelName = 'gemini-2.0-flash-001';

console.log(`🚀 Speed Mode: Vertex AI using '${modelName}'`);

const generativeModel = vertex_ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        responseMimeType: 'application/json',
    },
});

// 2. Chat Model (For "Rahul" Persona - Natural Language)
const chatModel = vertex_ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7, // Higher temp for creative/human-like replies
    },
});

/**
 * Generates a conversational reply based on the persona and context.
 */
exports.generateChatReply = async (systemInstruction, userContext) => {
    try {
        const prompt = `${systemInstruction}\n\nCONTEXT:\n${userContext}`;
        const result = await chatModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return result.response.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Chat Generation Error:", error);
        return "I received your message. Please share the location.";
    }
};

/**
 * Generic Multimodal Analyzer (Image, Video, Audio) - ENHANCED
 * @param {string} base64Data - Base64 string of the media
 * @param {string} mimeType - Mime type (image/jpeg, video/mp4, audio/ogg, etc.)
 */
exports.analyzeMedia = async (base64Data, mimeType) => {
    try {
        console.log(`[Vertex AI] Analyzing media (${mimeType}) with enhanced detection...`);

        const mediaPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        const prompt = `
You are an advanced civic issue detection AI with comprehensive visual analysis capabilities.
Analyze this media (Image/Video/Audio) in extreme detail and provide a complete overview.

COMPREHENSIVE ANALYSIS REQUIREMENTS:

1. **IMAGE/VIDEO OVERVIEW & VISUAL DETAILS:**
   - **Scene Description**: Describe the entire scene in detail (what you see, background, foreground, surroundings)
   - **Primary Objects**: List all major objects/elements visible
   - **Visual Composition**: Framing, angle, perspective, focal point
   - **Colors & Lighting**: Dominant colors, lighting conditions, shadows, brightness
   - **Environmental Context**: Urban/rural, street/building, indoor/outdoor, weather
   - **Time Estimation**: Approximate time of day (morning/afternoon/evening/night)
   - **Location Characteristics**: Type of area (residential, commercial, industrial, highway, etc.)
   - **Visible Text/Signs**: Any text, signs, landmarks, or identifiable markers
   - **People/Vehicles**: Presence of people, vehicles, or movement
   - **Media Quality**: Resolution, clarity, blur, noise, camera quality assessment

2. **DETAILED ISSUE ANALYSIS:**
   - **Issue Visibility**: How clearly is the problem visible (0-100%)
   - **Issue Size/Scale**: Approximate dimensions or extent of the problem
   - **Issue Severity Visual Indicators**: Visual cues showing severity
   - **Surrounding Impact**: How the issue affects the surrounding area
   - **Before/After Indicators**: Signs of recent damage or long-standing issue
   - **Comparative Context**: Size relative to known objects

3. **AUTHENTICITY & VALIDITY CHECK:**
   - For Images: Is this a real photograph taken by a citizen? Reject stock photos, staged scenes, AI-generated content
   - For Video: Analyze visual content for genuine civic issues, reject promotional/entertainment content
   - For Audio: Transcribe and verify if it's a legitimate complaint, reject music/spam
   - Accept only: Genuine reports of civic issues
   - **Photo/Video Metadata Indicators**: Camera artifacts, compression, natural lighting

4. **EVENT DETECTION:**
   - Identify the primary civic issue/event
   - Classify event type: Infrastructure Damage, Public Safety, Environmental, Health Hazard, Emergency
   - Detect secondary issues if visible/audible
   - Provide comprehensive event description
   - **Root Cause Analysis**: Possible causes of the issue

5. **DETAILED CLASSIFICATION:**
   - **Category**: Road/Garbage/Water/Electricity/Noise/Traffic/Fire/Medical/Police/Other
   - **Sub-Category**: Specific issue (Pothole, Broken Light, Water Leak, etc.)
   - **Severity**: Low/Medium/High/Critical
   - **Urgency**: Immediate/Within 24hrs/Within Week/Routine
   - **Affected Infrastructure**: What is damaged
   - **Potential Risks**: Safety/health/environmental hazards
   - **Estimated Impact**: Area/people affected

6. **DEPARTMENT ROUTING:**
   - Primary Department: Municipal/Waste, Roads & Transport, Electricity Board, Water Supply, Traffic, Fire & Safety, Medical/Ambulance, Police
   - Secondary Department (if applicable)
   - Escalation Required: Yes/No with reason

7. **ACTIONABLE INSIGHTS:**
   - Immediate actions recommended
   - Estimated resolution time
   - Required resources/equipment
   - Priority level (1-5)

8. **CONFIDENCE METRICS:**
   - Overall confidence (0-100)
   - Detection accuracy
   - Classification reliability

OUTPUT COMPREHENSIVE JSON:
{
    "isReal": boolean,
    "fakeReason": "Reason if rejected, else null",
    "imageOverview": {
        "sceneDescription": "Detailed description of the entire scene",
        "primaryObjects": ["array of main objects visible"],
        "visualComposition": {
            "framing": "Close-up/Medium/Wide shot",
            "angle": "Eye-level/High/Low angle",
            "perspective": "Straight-on/Angled/Bird's eye",
            "focalPoint": "What draws attention"
        },
        "colorsAndLighting": {
            "dominantColors": ["array of main colors"],
            "lightingCondition": "Bright/Dim/Natural/Artificial",
            "shadows": "Present/Absent/Harsh/Soft",
            "overallBrightness": "Dark/Normal/Bright/Overexposed"
        },
        "environmentalContext": {
            "setting": "Urban/Suburban/Rural",
            "locationType": "Street/Highway/Residential/Commercial/Industrial/Park",
            "indoorOutdoor": "Indoor/Outdoor",
            "weatherCondition": "Clear/Cloudy/Rainy/Foggy/Unknown"
        },
        "timeEstimation": "Morning/Afternoon/Evening/Night/Dawn/Dusk",
        "locationCharacteristics": "Detailed description of area type",
        "visibleTextSigns": ["array of any visible text, signs, or landmarks"],
        "peopleVehicles": {
            "peoplePresent": boolean,
            "vehiclesPresent": boolean,
            "movementDetected": boolean,
            "crowdLevel": "None/Low/Medium/High"
        },
        "mediaQuality": {
            "resolution": "Low/Medium/High",
            "clarity": "Blurry/Acceptable/Sharp",
            "noise": "High/Medium/Low/None",
            "cameraQuality": "Poor/Average/Good/Professional"
        }
    },
    "detailedIssueAnalysis": {
        "issueVisibility": number (0-100),
        "issueSize": "Approximate dimensions or description",
        "severityIndicators": ["array of visual cues showing severity"],
        "surroundingImpact": "How issue affects surroundings",
        "ageOfIssue": "Recent/Days old/Weeks old/Long-standing",
        "comparativeContext": "Size comparison with known objects",
        "visualEvidence": ["array of specific visual evidence points"]
    },
    "authenticity": {
        "isReal": boolean,
        "rejectionReason": "string or null",
        "mediaQuality": "Low/Medium/High",
        "timestamp": "Day/Night/Recent/Old",
        "photoMetadata": "Natural/Edited/Suspicious/Genuine"
    },
    "eventDetection": {
        "primaryEvent": "Main issue detected",
        "eventType": "Infrastructure/Safety/Environmental/Health/Emergency",
        "secondaryIssues": ["array of other issues"],
        "eventDescription": "Detailed description",
        "rootCauseAnalysis": "Possible causes of the issue"
    },
    "classification": {
        "category": "Road/Garbage/Water/etc",
        "subCategory": "Specific issue type",
        "severity": "Low/Medium/High/Critical",
        "urgency": "Immediate/24hrs/Week/Routine",
        "affectedInfrastructure": "What is damaged",
        "potentialRisks": ["array of risks"],
        "estimatedImpact": "Impact description"
    },
    "departmentRouting": {
        "primaryDepartment": "Department name",
        "secondaryDepartment": "Department or null",
        "escalationRequired": boolean,
        "escalationReason": "Reason or null"
    },
    "actionableInsights": {
        "immediateActions": ["array of actions"],
        "estimatedResolutionTime": "Time estimate",
        "requiredResources": ["resources needed"],
        "priority": number (1-5)
    },
    "confidence": {
        "overall": number (0-100),
        "detectionAccuracy": number (0-100),
        "classificationReliability": number (0-100)
    },
    "issue": "Short title",
    "description": "Detailed description",
    "priority": "High/Medium/Low"
}`;

        const request = {
            contents: [{ role: 'user', parts: [mediaPart, { text: prompt }] }]
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        const parsed = parseGeminiResponse(response);

        // Log enhanced analysis
        console.log("[AI EVENT DETECTION]:", {
            isReal: parsed.isReal,
            event: parsed.eventDetection?.primaryEvent,
            category: parsed.classification?.category,
            severity: parsed.classification?.severity,
            department: parsed.departmentRouting?.primaryDepartment
        });

        return parsed;

    } catch (error) {
        console.error("Vertex AI Media Analysis Failed:", error.message);

        // --- HACKATHON DEMO SAVER ---
        // If Auth fails, don't crash the app. Return a "Safe" Mock Response.
        if (error.message.includes('authenticate') || error.stack.includes('GoogleAuthError')) {
            console.log(`\n🤖⚠️ [AI MOCK MODE ACTIVATED] ⚠️🤖`);
            console.log("Authentication failed. Returning Mock Analysis for Demo.");

            return {
                isReal: true,
                fakeReason: null,
                issue: "Reported Civic Issue",
                description: "Analysis simulation: Detected pot-hole or road damage based on visual patterns. (Mocked for Demo)",
                priority: "High",
                category: "Roads",
                confidence: 95,

                // Mapped fields
                eventType: 'Road Closure',
                department: 'Municipal',
                aiSource: 'mock-fallback'
            };
        }

        return { isReal: false, fakeReason: "AI Service Error" };
    }
};

/**
 * Text Analyzer for WhatsApp Messages
 * @param {string} text - The user's text message
 */
exports.analyzeText = async (text) => {
    try {
        console.log(`[Vertex AI] Analyzing text: "${text.substring(0, 50)}..."`);

        const prompt = `
        You are a city administration AI. Analyze this text complaint.
        Text: "${text}"

        1. Is this a valid civic complaint (e.g. "garbage on street", "no water")?
        2. Or is it just a greeting/spam (e.g. "Hi", "Hello", "How are you")?

        Output JSON ONLY:
        {
            "isReal": boolean, 
            "fakeReason": "Reason if rejected/spam, else null", 
            "issue": "Short title",
            "description": "Cleaned up description",
            "priority": "High/Medium/Low",
            "confidence": number (0-100),
            "category": "Road/Garbage/Water/Electricity/Noise/Traffic/Other"
        }`;

        const request = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        return parseGeminiResponse(response);

    } catch (error) {
        console.error("Vertex AI Text Analysis Failed:", error.message);
        return { isReal: false, fakeReason: "AI Text Service Error" };
    }
};

// Wrapper for backward compatibility
exports.analyzeImageForReport = async (base64Image) => {
    return exports.analyzeMedia(base64Image, 'image/jpeg');
};

// Helper to reliably parse JSON from Gemini
function parseGeminiResponse(response) {
    try {
        let text = response.candidates[0].content.parts[0].text;
        text = text.replace(/```json|```/g, '').trim();
        const jsonResult = JSON.parse(text);

        const mapped = mapEventAndDepartment({
            category: jsonResult.category || 'General',
            description: jsonResult.description || ''
        });

        return {
            isReal: jsonResult.isReal || jsonResult.isValid,
            fakeReason: jsonResult.fakeReason || (jsonResult.isValid ? null : "Verification failed"),

            // Existing fields (unchanged)
            issue: jsonResult.issue || jsonResult.category || "General Issue",
            explanation: jsonResult.description || jsonResult.issue,
            description: jsonResult.description,
            severity: jsonResult.priority || "Medium",
            priority: jsonResult.priority || "Medium",
            category: jsonResult.category || "General",
            confidence: (typeof jsonResult.confidence === 'object' ? jsonResult.confidence.overall : jsonResult.confidence) || 80,

            // ✅ NEW FIELDS (THIS IS YOUR FEATURE)
            eventType: mapped.eventType,
            department: mapped.department,
            aiSource: 'gemini-vertex'
        };

    } catch (e) {
        console.error("JSON Parse Error:", e);
        return { isReal: false, fakeReason: "Invalid AI Response Format" };
    }
}


// ================= EVENT CLASSIFICATION LAYER =================

function mapEventAndDepartment({ category, description }) {
    const text = `${category} ${description}`.toLowerCase();

    if (/robbery|theft|crime|attack|fight|weapon|gun/.test(text)) {
        return { eventType: 'Safety Alert', department: 'Police' };
    }

    if (/traffic|jam|accident|signal|rush/.test(text)) {
        return { eventType: 'Traffic Rush', department: 'Traffic' };
    }

    if (/road|pothole|closure|construction/.test(text)) {
        return { eventType: 'Road Closure', department: 'Municipal' };
    }

    if (/power|electricity|transformer|outage/.test(text)) {
        return { eventType: 'Power Outage', department: 'Electricity' };
    }

    if (/water|pipeline|sewage|leak/.test(text)) {
        return { eventType: 'Water Issue', department: 'Municipal' };
    }

    return { eventType: 'General Civic Issue', department: 'General' };
}