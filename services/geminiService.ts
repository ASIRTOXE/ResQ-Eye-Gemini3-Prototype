import { GoogleGenAI, Modality } from "@google/genai";
import { fileToGenerativePart } from "../utils/fileUtils";

const SYSTEM_PROMPT = `You are **EYE-RESQ**, an autonomous Structural & Casualty Analysis System.

YOUR INTERFACE BEHAVIOR:
Whenever I send you a video or image, DO NOT respond with paragraphs. You must simulate a DIGITAL DASHBOARD using Markdown.

Follow this EXACT structure:

# 🔴 LIVE THREAT MONITOR

## 🏗️ STRUCTURAL INTEGRITY
- **Collapse Probability:** [0-100%]
- **Material Fatigue:** [Describe specific walls/beams]
- **CRITICAL ALERT:** [If safe, say NONE. If danger, specify zone]

## 👥 BIO-SIGNATURES (SURVIVORS)
- **Visual Confirmation:** [Yes/No]
- **Estimated Location:** [e.g., Under north rubble, Depth: 2m]
- **Status:** [Mobile / Trapped / Unconscious]

## 🗺️ TACTICAL RECOMMENDATION
1. **ENTRY PATH:** [Suggest safest route: North Window / Roof / Tunnel]
2. **REQUIRED GEAR:** [Hydraulics / Drones / K9 Unit]

---
**SYSTEM MESSAGE:** [Add a one-line professional military-style summary here]`;

const LIVE_PROMPT = "Scan for IMMEDIATE DANGER (Fire, Collapse, Weapons) or SURVIVORS. Keep it extremely brief. If Safe, output 'SAFE'. If Danger, output 'ALERT: [TYPE]'.";

// --- 1. DEEP ANALYSIS (Thinking Mode) ---
export const analyzeVideo = async (videoFile: File): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key configuration missing.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const videoPart = await fileToGenerativePart(videoFile);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Feature: Analyze images/video with Pro
      contents: {
        role: 'user',
        parts: [
          videoPart,
          { text: "Analyze this feed deeply. Identify structural weaknesses and potential survivor locations." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        // Feature: Thinking more when needed
        thinkingConfig: { thinkingBudget: 32768 }, 
        // Do not set maxOutputTokens when using thinkingConfig
      }
    });

    if (!response.text) throw new Error("No analysis generated.");
    return response.text;

  } catch (error: any) {
    let errorMessage = "Failed to analyze video.";
    
    // Safely extract error message
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
        // Handle raw JSON error objects from API
        errorMessage = error.error?.message || JSON.stringify(error);
    } else {
        errorMessage = String(error);
    }

    console.error("Gemini Analysis Error:", errorMessage);

    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("⚠️ QUOTA EXCEEDED: The Deep Analysis model (Gemini-3-Pro) is overloaded. Please try again later or use Live Mode.");
    }

    throw new Error(errorMessage);
  }
};

// --- 2. FAST LIVE SNAPSHOTS (Flash) ---
export const analyzeLiveFrame = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Fixed: Use standard Gemini 2.0 Flash to avoid 404s with Lite preview
      contents: {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: LIVE_PROMPT }
        ]
      },
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "SAFE";
  } catch (error: any) {
    let errorMessage = "";
    if (typeof error === 'object' && error !== null) {
        errorMessage = error.error?.message || error.message || JSON.stringify(error);
    } else {
        errorMessage = String(error);
    }
    
    errorMessage = errorMessage.toLowerCase();

    const isRateLimit = 
        error.status === 429 || 
        errorMessage.includes('429') || 
        errorMessage.includes('quota') || 
        errorMessage.includes('resource_exhausted');

    if (isRateLimit) {
        console.warn("Live Analysis Paused: Rate Limit Reached");
        return "STATUS: RATE LIMIT EXCEEDED // STANDBY";
    }
    
    console.error("Live Analysis Error:", error);
    return "SAFE";
  }
};

// --- 3. MAPS GROUNDING (Gemini 2.5 Flash) ---
export const getTacticalMapInfo = async (latitude: number, longitude: number, query: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Feature: Use Google Maps data
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude,
                    longitude
                }
            }
        },
        systemInstruction: "You are a tactical coordinator. Provide location-based intelligence. Always include links from the grounding chunks.",
      }
    });

    // Check for grounding chunks to extract URLs if needed, but returning text usually includes markdown links
    return response.text || "No intel available.";
  } catch (error: any) {
    console.error("Maps Error:", error);
    throw new Error("Failed to retrieve tactical map data.");
  }
}

// --- 4. AUDIO TRANSCRIPTION (Gemini 3 Flash) ---
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
   const apiKey = process.env.API_KEY;
   if (!apiKey) throw new Error("API Key missing");
   
   const ai = new GoogleGenAI({ apiKey });

   // Convert Blob to Base64
   const reader = new FileReader();
   return new Promise((resolve, reject) => {
     reader.onloadend = async () => {
       try {
         const base64String = reader.result as string;
         const base64Data = base64String.split(',')[1];
         
         const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Feature: Transcribe Audio
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Data } },
                        { text: "Transcribe this tactical audio log verbatim." }
                    ]
                }
            ]
         });
         resolve(response.text || "Transcription empty.");
       } catch (e) {
         reject(e);
       }
     };
     reader.onerror = reject;
     reader.readAsDataURL(audioBlob);
   });
}