let aiClient = null;

async function getGeminiClient() {
    if (aiClient) {
        return aiClient;
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const { GoogleGenAI } = await import("@google/genai");

    aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    return aiClient;
}

async function generateAssistantReply(messageText) {
    if (
        !messageText ||
        typeof messageText !== "string" ||
        messageText.trim() === ""
    ) {
        throw new Error("A valid message is required");
    }

    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
        model:
            process.env.GEMINI_MODEL ||
            "gemini-3.5-flash-lite",

        contents: messageText.trim(),

        config: {
            systemInstruction: `
You are the safety assistant for Afaai Guide, a platform about snakes in Palestine.

Your responsibilities:
- Answer in the same language used by the user.
- Give immediate safety advice before discussing identification.
- Never claim that a snake species is confirmed from text or an image.
- Clearly state uncertainty when identification is not reliable.
- Never encourage touching, capturing, chasing, or killing a snake.
- If the user reports a bite, prioritize urgent medical assistance.
- Do not advise cutting the wound, sucking venom, applying ice, or using a tight tourniquet.
- Keep responses concise and practical.
- State that the assistant does not replace emergency services or a qualified expert.
      `.trim(),

            temperature: 0.2,
            maxOutputTokens: 400,
        },
    });

    const reply = response.text?.trim();

    if (!reply) {
        throw new Error("Gemini returned an empty response");
    }

    return {
        reply,
        provider: "GOOGLE_GEMINI",
        model:
            process.env.GEMINI_MODEL ||
            "gemini-3.5-flash-lite",
    };
}

async function analyzeSnakeImage(
    imageBuffer,
    mimeType,
    userMessage = ""
) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error("A valid image buffer is required");
    }

    const ai = await getGeminiClient();

    const prompt = `
You are the safety assistant for Afaai Guide, a platform about snakes in Palestine.

Analyze the attached image carefully.

User message:
${userMessage.trim() || "The user uploaded a snake image without additional text."}

Instructions:
- Reply in the same language used by the user. If no language is clear, reply in Arabic.
- Begin with immediate safety advice.
- Never claim that the species identification is certain.
- State clearly when the image is unclear, distant, blurry, or insufficient.
- Mention one or more possible species only when visually plausible.
- Never encourage approaching, touching, capturing, chasing, or killing the snake.
- If the image does not contain a snake, say so clearly.
- If a potentially dangerous snake is visible, recommend maintaining distance and contacting a qualified local expert.
- Do not provide medical diagnosis.
- Keep the response concise and practical.
- State that image-based identification may be inaccurate.
  `.trim();

    const response = await ai.models.generateContent({
        model:
            process.env.GEMINI_MODEL ||
            "gemini-3.5-flash-lite",

        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: prompt,
                    },
                    {
                        inlineData: {
                            mimeType,
                            data: imageBuffer.toString("base64"),
                        },
                    },
                ],
            },
        ],

        config: {
            temperature: 0.2,
            maxOutputTokens: 500,
        },
    });

    const reply = response.text?.trim();

    if (!reply) {
        throw new Error("Gemini returned an empty image analysis");
    }

    return {
        reply,
        provider: "GOOGLE_GEMINI",
        model:
            process.env.GEMINI_MODEL ||
            "gemini-3.5-flash-lite",
    };
}

module.exports = {
    generateAssistantReply,
    analyzeSnakeImage,
};