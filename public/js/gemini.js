/**
 * CivicLens - Google Gemini API Integration
 * Handles AI-powered analysis of civic complaints
 */

class GeminiAnalyzer {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.apiUrl = CONFIG.GEMINI_API_URL;
    }

    /**
     * Analyze a civic complaint using Google Gemini
     * @param {string} complaint - The complaint text
     * @param {string} location - Optional location
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeComplaint(complaint, location = '') {
        // Use mock data in demo mode or if API key not configured
        if (CONFIG.DEMO_MODE || this.apiKey === 'YOUR_GEMINI_API_KEY') {
            console.log('Using mock analysis (Demo Mode or API key not configured)');
            return this.getMockAnalysis(complaint);
        }

        try {
            const prompt = this.buildPrompt(complaint, location);
            const response = await this.callGeminiAPI(prompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API Error:', error);
            // Fallback to mock data on error
            return this.getMockAnalysis(complaint);
        }
    }

    /**
     * Build the prompt for Gemini
     */
    buildPrompt(complaint, location) {
        return `You are an AI assistant for a civic issue detection platform. Analyze the following civic complaint and provide a structured response.

Complaint: "${complaint}"
${location ? `Location: ${location}` : ''}

Respond in the following JSON format ONLY (no additional text):
{
    "category": "<one of: Infrastructure, Safety, Sanitation, Utilities, Noise, Environment, Other>",
    "sentiment": "<one of: positive, neutral, negative>",
    "urgency": "<one of: low, medium, high, critical>",
    "urgencyScore": <number 1-100>,
    "summary": "<brief 1-2 sentence summary of the issue>",
    "recommendations": ["<action 1>", "<action 2>", "<action 3>"]
}`;
    }

    /**
     * Call the Gemini API
     */
    async callGeminiAPI(prompt) {
        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Parse the Gemini response
     */
    parseResponse(response) {
        try {
            const text = response.candidates[0].content.parts[0].text;
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Parse error:', error);
            return this.getMockAnalysis('');
        }
    }

    /**
     * Get mock analysis for demo purposes
     */
    getMockAnalysis(complaint) {
        const lowerComplaint = complaint.toLowerCase();

        // Determine category based on keywords
        let category = 'Other';
        let urgency = 'medium';
        let urgencyScore = 50;

        if (lowerComplaint.includes('pothole') || lowerComplaint.includes('road') || lowerComplaint.includes('bridge')) {
            category = 'Infrastructure';
            urgency = 'high';
            urgencyScore = 75;
        } else if (lowerComplaint.includes('light') || lowerComplaint.includes('electric') || lowerComplaint.includes('power')) {
            category = 'Utilities';
            urgency = 'medium';
            urgencyScore = 60;
        } else if (lowerComplaint.includes('garbage') || lowerComplaint.includes('trash') || lowerComplaint.includes('waste')) {
            category = 'Sanitation';
            urgency = 'high';
            urgencyScore = 70;
        } else if (lowerComplaint.includes('noise') || lowerComplaint.includes('loud')) {
            category = 'Noise';
            urgency = 'medium';
            urgencyScore = 45;
        } else if (lowerComplaint.includes('unsafe') || lowerComplaint.includes('danger') || lowerComplaint.includes('accident')) {
            category = 'Safety';
            urgency = 'critical';
            urgencyScore = 90;
        }

        // Check for urgency keywords
        if (lowerComplaint.includes('emergency') || lowerComplaint.includes('immediate') || lowerComplaint.includes('urgent')) {
            urgency = 'critical';
            urgencyScore = 95;
        }

        const mockResponses = {
            Infrastructure: {
                summary: 'Infrastructure damage reported that requires immediate attention from municipal authorities. This issue poses potential safety risks to commuters.',
                recommendations: [
                    'Dispatch road maintenance team for immediate assessment',
                    'Place warning signs and barriers around the affected area',
                    'Schedule permanent repair within 48 hours'
                ]
            },
            Utilities: {
                summary: 'Utility service disruption affecting public safety and convenience. Non-functional street lighting creates security concerns.',
                recommendations: [
                    'Log complaint with electricity department',
                    'Deploy temporary lighting solution',
                    'Schedule repair by electrical maintenance team'
                ]
            },
            Sanitation: {
                summary: 'Waste management issue causing environmental and health concerns in the area. Immediate cleanup required.',
                recommendations: [
                    'Dispatch sanitation team for immediate cleanup',
                    'Increase garbage collection frequency in the area',
                    'Install additional waste bins if needed'
                ]
            },
            Noise: {
                summary: 'Noise disturbance complaint indicating potential violation of local noise ordinances. Affects quality of life for residents.',
                recommendations: [
                    'Issue noise violation warning to responsible party',
                    'Schedule inspection during peak noise hours',
                    'Enforce noise regulation compliance'
                ]
            },
            Safety: {
                summary: 'Safety hazard identified that requires urgent attention. Risk of injury or property damage if not addressed promptly.',
                recommendations: [
                    'Deploy emergency response team immediately',
                    'Secure the affected area with barriers',
                    'Notify relevant emergency services'
                ]
            },
            Other: {
                summary: 'General civic issue reported that requires review and appropriate action by local authorities.',
                recommendations: [
                    'Review and categorize the complaint',
                    'Assign to appropriate department',
                    'Follow up within 3 business days'
                ]
            }
        };

        const response = mockResponses[category];

        return {
            category,
            sentiment: 'negative',
            urgency,
            urgencyScore,
            summary: response.summary,
            recommendations: response.recommendations
        };
    }
}

// Export for use in app.js
window.GeminiAnalyzer = GeminiAnalyzer;
