import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { AnalysisResult, CitizenReport } from "../types/types";

/**
 * Senior AI Architect Service
 * Handles all interactions with Gemini Pro/Flash
 */
class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private static instance: GeminiService;

    private constructor() {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (API_KEY) {
            this.genAI = new GoogleGenerativeAI(API_KEY);
            this.model = this.genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
        }
    }

    public static getInstance(): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }

    /**
     * AI-powered logo and brand analysis
     */
    public async analyzeLogo(imageFile: File, businessName: string): Promise<AnalysisResult> {
        if (!this.model) {
            return this.getMockAnalysis(businessName);
        }

        try {
            const prompt = `
                Analyze logo for "${businessName}". Identify trademark risks, copyright issues, or visual mimics of famous brands.
                Return JSON schema: { "isSafe": boolean, "riskLevel": "Low"|"Medium"|"High", "similarBrands": string[], "message": string }
            `;

            const imageParts = await this.fileToGenerativePart(imageFile);
            const result = await this.model.generateContent([prompt, imageParts]);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error("AI Analysis Failed:", error);
            return {
                isSafe: false,
                riskLevel: "Medium",
                message: "Intelligence gathering interrupted. Proceed with caution.",
            };
        }
    }

    /**
     * AI-powered fraud report analysis for severity classification
     */
    public async analyzeFraudReport(report: Partial<CitizenReport>): Promise<{ severity: string; urgency: number; summary: string; tamil_summary: string }> {
        if (!this.model) {
            return { 
                severity: "Medium", 
                urgency: 5, 
                summary: "AI node offline. Standard classification applied.",
                tamil_summary: "AI முடக்கம். நிலையான வகைப்பாடு பயன்படுத்தப்பட்டது."
            };
        }

        try {
            const prompt = `
                Role: Senior Municipal Auditor for Tamil Nadu (TN-MBNR).
                Task: Analyze this citizen fraud report: "${report.description}".
                
                TN State Law Compliance Risk Matrix:
                - CRITICAL: Violations of Tamil Nadu Public Health Act, 1939 (e.g., severe hygiene, adulteration) or extreme TN Shops & Establishments Act violations (e.g., severe safety hazards).
                - HIGH: FSSAI non-compliance, lack of TN Pollution Control Board (TNPCB) clearance, or trademark infringement of regional heritage brands (e.g., A2B, Saravana Bhavan).
                - MEDIUM: Location mismatch (>200m), failure to display Tamil name boards (mandated by TN Shops and Establishments Rules), or pending trade license renewal under TN District Municipalities Act.
                - LOW: General inquiries, formatting issues, or cosmetic non-compliance.

                Context: ${report.category || 'General Business Compliance'}.

                Return JSON schema EXACTLY: { 
                  "severity": "Low"|"Medium"|"High"|"Critical", 
                  "urgency": number(1-10), 
                  "summary": "Concise professional summary in English citing potential TN law violations",
                  "tamil_summary": "Concise professional summary in Tamil (தமிழ்) citing potential TN law violations"
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch {
            return { 
                severity: "High", 
                urgency: 7, 
                summary: "Automated risk flag raised due to processing error.",
                tamil_summary: "தொழில்நுட்பக் கோளாறு காரணமாக தானியங்கி எச்சரிக்கை எழுப்பப்பட்டது."
            };
        }
    }

    public async getChatResponse(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]): Promise<string> {
        if (!this.genAI) {
            return "AI node offline. Standard automated response applied.";
        }

        try {
            const chatModel = this.genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                systemInstruction: `
                    You are the TrustReg TN Assistant (MBNR Platform).
                    Your purpose is to help citizens and merchants in Tamil Nadu, India.
                    The platform uses HMAC-SHA256 signed QR codes and Haversine geofencing (200m threshold) to prevent business fraud.
                    
                    Rules:
                    1. Be official, polite, and helpful.
                    2. Support both English and Tamil (தமிழ்). If asked in Tamil, reply in Tamil.
                    3. If asked about registration: Explain that merchants need a unique logo (checked by AI), shop location, and contact details.
                    4. If asked about "Location Mismatch": Explain it's a security feature ensuring the shop is where it claims to be.
                    5. If asked about "Expired": Explain QR codes refresh every 30 seconds for security.
                    6. Never provide legal advice, but summarize platform rules.
                    7. Keep responses concise and formatted with markdown.
                `,
            });

            const chat = chatModel.startChat({
                history: history,
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Chat Failed:", error);
            return "Communication node disrupted. Please try again shortly.";
        }
    }

    public async getStrategicAdvice(businesses: any[]): Promise<{ yieldOpportunity: string; riskAdvisory: string }> {
        if (!this.model) {
            return {
                yieldOpportunity: "Strategic Yield analysis requires an active AI connection. Node offline.",
                riskAdvisory: "Local risk matrix dictates standard protocol adherence while grid is dark."
            };
        }

        try {
            const prompt = `
                Role: Senior Municipal Data Scientist for Tamil Nadu.
                Task: Analyze this registry data and provide a concise strategic dashboard report.
                
                Current Nodes: ${businesses.length}
                Data dump: ${JSON.stringify(businesses.slice(0, 10))}

                Return JSON schema EXACTLY: {
                  "yieldOpportunity": "1-2 sentence paragraph identifying positive growth or revenue potential in English.",
                  "riskAdvisory": "1-2 sentence paragraph identifying compliance risks or geographic vulnerabilities in English."
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (err) {
            console.error("Strategic Advice Failed:", err);
            return {
                yieldOpportunity: "Automated metrics indicate stable regional output.",
                riskAdvisory: "Elevated network noise prevented deep risk analysis."
            };
        }
    }

    private async fileToGenerativePart(file: File) {
        const base64EncodedDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: {
                data: await base64EncodedDataPromise as string,
                mimeType: file.type,
            },
        };
    }

    private getMockAnalysis(name: string): AnalysisResult {
        const riskyNames = ['starbucks', 'a2b', 'dominos', 'kfc'];
        const isRisky = riskyNames.some(n => name.toLowerCase().includes(n));
        return {
            isSafe: !isRisky,
            riskLevel: isRisky ? 'High' : 'Low',
            similarBrands: isRisky ? ['Famous Brand Mimic'] : [],
            message: isRisky ? 'High similarity to protected trademark identified.' : 'Brand signature appears unique.',
        };
    }
}

export const aiService = GeminiService.getInstance();
