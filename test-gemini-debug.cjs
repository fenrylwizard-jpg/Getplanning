require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const pdfPath = "C:\\Users\\Imam\\Downloads\\herlin\\6127.1 ECOLE HERLIN PLANNING D'INTENTION détaillé du 20251111 A3.pdf";

async function main() {
    console.log("API Key present:", !!process.env.GEMINI_API_KEY);
    console.log("API Key prefix:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + "..." : "NONE");
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    console.log("Reading PDF...");
    const bytes = fs.readFileSync(pdfPath);
    const base64Data = Buffer.from(bytes).toString("base64");
    console.log(`PDF size: ${bytes.length} bytes, base64 length: ${base64Data.length}`);

    const prompt = `This is a construction project planning (Gantt chart).
Please extract all the major task milestones from this schedule.
Return ONLY a valid JSON array of objects without markdown blocks or backticks.

For each task, provide:
- "name": The name of the task
- "category": The main category it belongs to (e.g., Gros Œuvre, Second Œuvre, Finitions) based on visual grouping if any. If no category, just put "Général".
- "startDate": The estimated start date (format YYYY-MM-DD). Infer from the timeline markers.
- "endDate": The estimated end date (format YYYY-MM-DD). Infer from the timeline markers.
- "progress": Estimate completion percentage if marked (as a decimal between 0 and 1) otherwise 0.

Respond with ONLY the JSON array. Do not include markdown formatting.`;

    try {
        console.log("Calling gemini-3.1-pro with inlineData...");
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro',
            contents: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "application/pdf"
                    }
                },
                { text: prompt }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });
        
        console.log("SUCCESS!");
        console.log("Response text (first 500 chars):", (response.text || "").substring(0, 500));
        
        const milestones = JSON.parse(response.text);
        console.log(`Extracted ${milestones.length} milestones.`);
        console.log("First 3:", JSON.stringify(milestones.slice(0, 3), null, 2));
        
    } catch(err) {
        console.error("FULL ERROR:", err);
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        if (err.status) console.error("Status:", err.status);
        if (err.statusText) console.error("StatusText:", err.statusText);
    }
}

main();
