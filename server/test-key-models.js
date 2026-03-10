const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCr1WwliZSA7gOFiN6ZPX13ESY0cdVH-dk");

async function testKey() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello!");
            console.log(`SUCCESS for ${m}`);
            console.log(result.response.text());
            return;
        } catch (error) {
            console.error(`ERROR for ${m}:`, error.message);
        }
    }
}

testKey();
