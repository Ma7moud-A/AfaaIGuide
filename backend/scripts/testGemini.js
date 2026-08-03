require("dotenv").config();

const {
  generateAssistantReply,
} = require("../src/services/aiService");

async function testGemini() {
  try {
    const result = await generateAssistantReply(
      "رأيت أفعى بجانب باب المنزل، ماذا أفعل؟"
    );

    console.log("Gemini connection successful");
    console.log("Provider:", result.provider);
    console.log("Model:", result.model);
    console.log("Reply:", result.reply);
  } catch (error) {
    console.error("Gemini test failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

testGemini();