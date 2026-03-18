// List all available Gemini models via the REST API
const apiKey = process.argv[2];
if (!apiKey) {
    console.error("Usage: node list-models.mjs <GEMINI_API_KEY>");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

const resp = await fetch(url);
const data = await resp.json();

if (data.models) {
    console.log("Available models:\n");
    data.models
        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
        .forEach(m => {
            console.log(`  ${m.name}  -  ${m.displayName}`);
        });
} else {
    console.log("Response:", JSON.stringify(data, null, 2));
}
