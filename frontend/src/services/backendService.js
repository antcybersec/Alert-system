// Real Backend Service
const API_BASE_URL = 'https://team-sync-ranchi-hack.onrender.com';
export const verifyImageWithAI = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result;
            try {
                const response = await fetch(`${API_BASE_URL}/api/reports/verify-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64, type: 'general' })
                });
                const data = await response.json();
                console.log("[BACKEND RESPONSE]:", data);

                if (response.ok) {
                    // Return the complete analysis object with all comprehensive details
                    resolve({
                        // Basic fields for backward compatibility
                        explanation: data.analysis.explanation || data.analysis.detected_issue,
                        ai_confidence: data.analysis.ai_confidence || data.analysis.confidence?.overall,
                        verified: data.analysis.verified,
                        detected_issue: data.analysis.detected_issue,
                        department: data.analysis.department,

                        // Comprehensive analysis fields
                        imageOverview: data.analysis.imageOverview,
                        detailedIssueAnalysis: data.analysis.detailedIssueAnalysis,
                        eventDetection: data.analysis.eventDetection,
                        classification: data.analysis.classification,
                        departmentRouting: data.analysis.departmentRouting,
                        actionableInsights: data.analysis.actionableInsights,
                        authenticity: data.analysis.authenticity,
                        confidence: data.analysis.confidence,

                        // Store full analysis for debugging
                        fullAnalysis: data.analysis
                    });
                } else {
                    console.error("Backend Error Detail:", data.details || data.error);
                    reject(new Error(data.error || "AI Analysis Failed"));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

export const submitReportToBackend = async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to create report");
    return result;
};

export const detectLocationFromTextBackend = async (text) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reports/detect-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to detect location");
        return result;
    } catch (error) {
        console.error("Detect Location Error:", error);
        throw error;
    }
};
