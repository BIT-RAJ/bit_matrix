const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCr1WwliZSA7gOFiN6ZPX13ESY0cdVH-dk");

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCr1WwliZSA7gOFiN6ZPX13ESY0cdVH-dk`);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS:");
            console.log(data.models.map(m => m.name).join("\n"));
        } else {
            console.log("RESPONSE:", data);
        }
    } catch (err) {
        console.error("fetch failed", err);
    }
}

listModels();
