const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

const vertex_ai = new VertexAI({
    project: process.env.GCP_PROJECT_ID,
    location: 'us-central1'
});

const modelName = 'gemini-2.0-flash-001';

const generativeModel = vertex_ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
        responseMimeType: 'application/json',
    },
});

/**
 * Generate a concise civic alert from report data
 * @param {Object} reportData - The report information
 * @returns {Promise<Object>} - Alert data with title, message, emoji, urgency
 */
exports.generateCivicAlert = async (reportData) => {
    try {
        const prompt = `
You are a civic alert generator. Create a SHORT, CLEAR, and ACTIONABLE alert for citizens.

REPORT DATA:
- Issue Type: ${reportData.type || 'General Issue'}
- Location: ${reportData.location?.address || 'Location not specified'}
- Severity: ${reportData.priority || 'Medium'}
- Description: ${reportData.description || 'No description'}
- Department: ${reportData.department || 'General'}
- Status: ${reportData.status || 'Pending'}

RULES:
1. Keep alert under 100 characters
2. Start with relevant emoji (🚧 for roads, 🔥 for fire, 💧 for water, 🗑️ for garbage, ⚠️ for general)
3. Include location name (short form)
4. Include time estimate if applicable
5. Use action words (closed, blocked, avoid, caution)
6. Be specific but concise

EXAMPLES:
- "🚧 Road closed near MG Road till 6 PM - Use alternate route"
- "🔥 Fire reported at Sector 5 - Emergency services on site"
- "💧 Water supply disrupted in Block A - Restoration by 8 PM"
- "🗑️ Garbage collection delayed in Zone 3 - Rescheduled to tomorrow"

RETURN JSON:
{
  "emoji": "emoji character",
  "title": "Short title (max 50 chars)",
  "message": "Full alert message (max 100 chars)",
  "urgency": "high/medium/low",
  "category": "roads/fire/water/garbage/general",
  "affectedArea": "Location name",
  "estimatedTime": "Time estimate or null"
}
`;

        const request = {
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }]
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;

        // Parse JSON
        let jsonStr = text;
        if (text.includes("```")) {
            jsonStr = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] || text;
        }

        const alertData = JSON.parse(jsonStr.trim());

        console.log("[AI ALERT GENERATED]:", alertData.message);

        return {
            success: true,
            alert: alertData
        };

    } catch (error) {
        console.error("[AI ALERT ERROR]:", error);

        // Fallback alert generation
        const emoji = reportData.type?.toLowerCase().includes('pothole') ? '🚧' :
            reportData.type?.toLowerCase().includes('fire') ? '🔥' :
                reportData.type?.toLowerCase().includes('water') ? '💧' :
                    reportData.type?.toLowerCase().includes('garbage') ? '🗑️' : '⚠️';

        return {
            success: false,
            alert: {
                emoji: emoji,
                title: reportData.type || 'Civic Alert',
                message: `${emoji} ${reportData.type || 'Issue'} reported at ${reportData.location?.address || 'location'}`,
                urgency: reportData.priority === 'High' ? 'high' : 'medium',
                category: 'general',
                affectedArea: reportData.location?.address || 'Unknown',
                estimatedTime: null
            }
        };
    }
};
