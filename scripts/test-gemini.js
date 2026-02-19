const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ Success with ${modelName}:`, response.text());
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${modelName}:`, error.message);
        return false;
    }
}

async function runTests() {
    // Test the one we just set
    await testModel("gemini-2.0-flash");

    // Test the stable alias
    await testModel("gemini-flash-latest");

    // Test 1.5 flash just in case
    await testModel("gemini-1.5-flash");
}

runTests();
