const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log("Fetching available models...");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to access client if needed, but actually we need the model manager if exposed, or just try to list.
        // The SDK might not expose listModels directly on the main class in all versions, 
        // but let's check the documentation or try the standard endpoint if the SDK supports it.
        // Actually, for the JS SDK, we might need to use the REST API manually if the SDK doesn't expose it easily in this version.
        // Let's try to assume the SDK has a way or just use a simple fetch to the API endpoint.

        // Direct fetch to list models
        const apiKey = process.env.GOOGLE_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        console.log("Models:", JSON.stringify(data, null, 2));

        // Filter for generateContent support
        const contentModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        console.log("\nModels supporting generateContent:");
        contentModels.forEach(m => console.log(`- ${m.name} (${m.displayName})`));

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
