const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set.");
        return;
    }

    const filePath = "C:\\Users\\Imam\\Downloads\\herlin\\6127.1 ECOLE HERLIN PLANNING D'INTENTION détaillé du 20251111 A3.pdf";
    console.log(`Uploading file: ${filePath}`);

    try {
        const uploadResponse = await ai.files.upload({
            file: filePath,
            mimeType: 'application/pdf',
        });
        console.log(`Uploaded file URI: ${uploadResponse.uri}`);

        const prompt = `This is a construction project planning (Gantt chart).
Please extract all the major task milestones from this schedule.
Return ONLY a valid JSON array of objects without markdown blocks or backticks.

For each task, provide:
- "name": The name of the task
- "category": The main category it belongs to (e.g., Gros Œuvre, Second Œuvre, Finitions) based on visual grouping if any. If no category, just put "Général".
- "startDate": The estimated start date (format YYYY-MM-DD). Infer from the timeline markers.
- "endDate": The estimated end date (format YYYY-MM-DD). Infer from the timeline markers.
- "progress": Estimate completion percentage if marked (as a decimal between 0 and 1) otherwise 0.

Respond with ONLY the JSON array. Do not include markdown formatting like \`\`\`json.`;

        console.log("Generating content...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                uploadResponse,
                { text: prompt }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        console.log("Response:");
        console.log(response.text);

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
