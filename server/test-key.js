const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCr1WwliZSA7gOFiN6ZPX13ESY0cdVH-dk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testKey() {
    try {
        const result = await model.generateContent("Hello!");
        console.log("SUCCESS");
        console.log(result.response.text());
    } catch (error) {
        console.error("ERROR:");
        console.error(error.message);
    }
}

testKey();
