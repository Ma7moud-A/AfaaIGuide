let aiClient = null;

async function getGeminiClient() {
    if (aiClient) {
        return aiClient;
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error(
            "GEMINI_API_KEY is not configured"
        );
    }

    const { GoogleGenAI } = await import(
        "@google/genai"
    );

    aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    return aiClient;
}

function getChatModel() {
    return (
        process.env.GEMINI_CHAT_MODEL ||
        process.env.GEMINI_MODEL ||
        "gemini-3.5-flash-lite"
    );
}

function getVisionModel() {
    return (
        process.env.GEMINI_VISION_MODEL ||
        process.env.GEMINI_MODEL ||
        "gemini-3.6-flash"
    );
}

async function generateAssistantReply(
    messageText
) {
    if (
        !messageText ||
        typeof messageText !== "string" ||
        messageText.trim() === ""
    ) {
        throw new Error(
            "A valid message is required"
        );
    }

    const ai = await getGeminiClient();
    const model = getChatModel();

    const response =
        await ai.models.generateContent({
            model,

            contents: messageText.trim(),

            config: {
                systemInstruction: `
You are the safety assistant for Afaai Guide, a platform about snakes.

Your responsibilities:
- Answer in the same language used by the user.
- Give safety advice when relevant.
- Never claim that a snake species is confirmed from text alone.
- Clearly communicate uncertainty.
- Never encourage touching, capturing, chasing, or killing a snake.
- If the user reports a bite, prioritize urgent medical assistance.
- Do not advise cutting the wound, sucking venom, applying ice, or using a tight tourniquet.
- Keep responses practical and concise.
- State that the assistant does not replace emergency services or a qualified expert.
        `.trim(),

                temperature: 0.2,
                maxOutputTokens: 500,
            },
        });

    const reply = response.text?.trim();

    if (!reply) {
        throw new Error(
            "Gemini returned an empty response"
        );
    }

    return {
        reply,
        provider: "GOOGLE_GEMINI",
        model,
    };
}

function clampScore(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(
        1,
        Math.max(0, number)
    );
}

function getReliabilityLabel(
    confidence,
    imageQuality,
    ambiguity
) {
    if (
        confidence >= 0.8 &&
        imageQuality >= 0.7 &&
        ambiguity <= 0.25
    ) {
        return "HIGH";
    }

    if (
        confidence >= 0.55 &&
        imageQuality >= 0.45
    ) {
        return "MEDIUM";
    }

    return "LOW";
}

function formatPercent(value) {
    return `${Math.round(
        clampScore(value) * 100
    )}%`;
}

function getPreferredArabicName(candidate) {
    const scientificName =
        candidate?.scientific_name?.trim();

    const preferredArabicNames = {
        "Walterinnesia aegyptia":
            "الأسود الخبيث",

        "Dolichophis jugularis":
            "العربيد الأسود",

        "Daboia palaestinae":
            "الأفعى الفلسطينية",

        "Cerastes gasperettii":
            "الأفعى العربية المقرنة",

        "Hemorrhois nummifer":
            "الأفعى البقلاوية",
    };

    return (
        preferredArabicNames[
        scientificName
        ] ||
        candidate?.common_name_ar ||
        candidate?.common_name ||
        scientificName ||
        "نوع غير محدد"
    );
}

function buildImageAnalysisReply(
    result,
    language
) {
    const isArabic =
        language !== "en";

    if (!result.is_snake) {
        return isArabic
            ? [
                "لا تظهر في الصورة أفعى بشكل واضح.",
                "",
                result.scene_description
                    ? `ما يظهر في الصورة: ${result.scene_description}`
                    : "",
                "",
                "إذا كنت تقصد أفعى موجودة في الصورة لكنها صغيرة أو بعيدة، ارفع صورة أوضح من مسافة آمنة.",
            ]
                .filter(Boolean)
                .join("\n")
            : [
                "No snake is clearly visible in this image.",
                "",
                result.scene_description
                    ? `Visible content: ${result.scene_description}`
                    : "",
                "",
                "If a snake is present but distant or small, upload a clearer image from a safe distance.",
            ]
                .filter(Boolean)
                .join("\n");
    }

    const confidence =
        clampScore(
            result.best_match?.confidence
        );

    const imageQuality =
        clampScore(
            result.image_quality
        );

    const ambiguity =
        clampScore(
            result.ambiguity
        );

    const reliability =
        getReliabilityLabel(
            confidence,
            imageQuality,
            ambiguity
        );

    const bestMatch =
        result.best_match || {};

    const alternatives =
        Array.isArray(
            result.alternatives
        )
            ? result.alternatives
            : [];

    const visibleFeatures =
        Array.isArray(
            result.visible_features
        )
            ? result.visible_features
            : [];

    const missingFeatures =
        Array.isArray(
            result.missing_features
        )
            ? result.missing_features
            : [];

    const dangerousAlternative =
        alternatives.find(
            (candidate) =>
                candidate?.potentially_dangerous &&
                clampScore(
                    candidate.confidence
                ) >= 0.15
        );

    if (isArabic) {
        const lines = [
            "⚠️ حافظ على مسافة آمنة ولا تحاول لمس الأفعى أو الإمساك بها.",
            "",
        ];

        if (
            reliability === "LOW" ||
            confidence < 0.45
        ) {
            lines.push(
                "لم أتمكن من تحديد النوع بدرجة موثوقية كافية."
            );

            if (bestMatch.scientific_name) {
                lines.push(
                    `🐍 أقرب احتمال: ${getPreferredArabicName(
                        bestMatch
                    )}`
                );

                lines.push(
                    `ثقة النموذج في هذا الاحتمال: ${formatPercent(
                        confidence
                    )}`
                );
            }
        } else {
            lines.push(
                `🐍 الأفعى غالبًا هي: ${getPreferredArabicName(
                    bestMatch
                )}`
            );

            lines.push(
                `ثقة النموذج: ${formatPercent(
                    confidence
                )}`
            );
        }

        lines.push(
            `جودة الصورة للتعرّف: ${formatPercent(
                imageQuality
            )}`
        );

        lines.push(
            `موثوقية النتيجة: ${reliability === "HIGH"
                ? "مرتفعة نسبيًا"
                : reliability === "MEDIUM"
                    ? "متوسطة"
                    : "منخفضة"
            }`
        );

        if (visibleFeatures.length) {
            lines.push("");
            lines.push(
                "السمات المرئية:"
            );

            visibleFeatures
                .slice(0, 5)
                .forEach((feature) => {
                    lines.push(
                        `• ${feature}`
                    );
                });
        }

        if (
            alternatives.length &&
            reliability !== "HIGH"
        ) {
            lines.push("");
            lines.push(
                "احتمالات أخرى:"
            );

            alternatives
                .slice(0, 3)
                .forEach((candidate) => {
                    lines.push(
                        `• ${getPreferredArabicName(
                            candidate
                        )} — ${formatPercent(
                            candidate.confidence
                        )}`
                    );
                });
        }

        if (missingFeatures.length) {
            lines.push("");

            lines.push(
                `ما ينقص لتحديد أدق: ${missingFeatures
                    .slice(0, 4)
                    .join("، ")}`
            );
        }

        if (dangerousAlternative) {
            lines.push("");

            lines.push(
                "⚠️ يوجد ضمن الاحتمالات نوع قد يكون خطرًا؛ تعامل مع الأفعى على أنها خطرة حتى يتم التأكد من خبير."
            );
        }

        if (result.needs_better_image) {
            lines.push("");

            lines.push(
                "يفضل رفع صورة أوضح للرأس والجسم والنقوش، من دون الاقتراب من الأفعى."
            );
        }

        lines.push("");

        lines.push(
            "هذه نتيجة أولية من صورة وليست تأكيدًا نهائيًا للنوع."
        );

        return lines.join("\n");
    }

    const lines = [
        "⚠️ Keep a safe distance and do not touch or capture the snake.",
        "",
    ];

    if (
        reliability === "LOW" ||
        confidence < 0.45
    ) {
        lines.push(
            "The species cannot be identified with sufficient reliability."
        );

        if (bestMatch.scientific_name) {
            lines.push(
                `Closest visual candidate: ${bestMatch.common_name ||
                bestMatch.scientific_name
                }`
            );

            lines.push(
                `Model confidence: ${formatPercent(
                    confidence
                )}`
            );
        }
    } else {
        lines.push(
            `Most likely species: ${bestMatch.common_name ||
            bestMatch.scientific_name ||
            "Unknown"
            }`
        );

        lines.push(
            `Model confidence: ${formatPercent(
                confidence
            )}`
        );
    }

    lines.push(
        `Image quality for identification: ${formatPercent(
            imageQuality
        )}`
    );

    lines.push(
        `Reliability: ${reliability}`
    );

    if (visibleFeatures.length) {
        lines.push("");
        lines.push(
            "Visible features:"
        );

        visibleFeatures
            .slice(0, 5)
            .forEach((feature) => {
                lines.push(
                    `• ${feature}`
                );
            });
    }

    if (
        alternatives.length &&
        reliability !== "HIGH"
    ) {
        lines.push("");
        lines.push(
            "Alternative candidates:"
        );

        alternatives
            .slice(0, 3)
            .forEach((candidate) => {
                lines.push(
                    `• ${candidate.common_name ||
                    candidate.scientific_name
                    } — ${formatPercent(
                        candidate.confidence
                    )}`
                );
            });
    }

    if (missingFeatures.length) {
        lines.push("");

        lines.push(
            `Missing diagnostic features: ${missingFeatures
                .slice(0, 4)
                .join(", ")}`
        );
    }

    if (dangerousAlternative) {
        lines.push("");

        lines.push(
            "⚠️ A potentially dangerous species is among the alternatives. Treat the snake as dangerous until verified by an expert."
        );
    }

    if (result.needs_better_image) {
        lines.push("");

        lines.push(
            "A clearer view of the head, body, and markings would improve identification. Do not approach the snake to obtain it."
        );
    }

    lines.push("");

    lines.push(
        "Image-based identification is preliminary and is not a definitive species confirmation."
    );

    return lines.join("\n");
}

async function analyzeSnakeImage(
    imageBuffer,
    mimeType,
    userMessage = ""
) {
    if (
        !Buffer.isBuffer(imageBuffer) ||
        imageBuffer.length === 0
    ) {
        throw new Error(
            "A valid image buffer is required"
        );
    }

    const ai = await getGeminiClient();
    const model = getVisionModel();

    const language =
        /[\u0600-\u06FF]/.test(
            userMessage || ""
        )
            ? "ar"
            : userMessage.trim()
                ? "en"
                : "ar";

    const prompt = `
You are the visual snake identification engine for Afaai Guide.

Your task is OPEN-WORLD snake identification.
You are NOT restricted to snakes currently stored in the Afaai Guide database.

Analyze the image scientifically and conservatively.

User message:
${userMessage.trim() ||
        "The user uploaded an image for snake identification."
        }

IMPORTANT RULES:

1. First decide whether a snake is actually visible.

2. Do not infer a species from color alone.

3. Compare morphology carefully:
   - head shape
   - neck distinction
   - body thickness
   - body proportions
   - scale appearance
   - dorsal pattern
   - ventral coloration when visible
   - eye and pupil appearance when visible
   - facial markings
   - tail shape
   - juvenile vs adult appearance

4. Consider geographic plausibility when location information is available.

5. If key diagnostic features are hidden, lower confidence.

6. Similar-looking species must be included as alternatives.

7. Never invent confidence. Use lower scores for unclear, distant, blurry, cropped, or diagnostically incomplete images.

8. A black snake must NOT automatically be classified as any particular black snake species.

9. If multiple dangerous and harmless species could plausibly match, mark the result as ambiguous.

10. Do not claim certainty.

11. If the image is not a snake, clearly classify it as not a snake.

12. Common names may vary by region, so prioritize scientific identity internally.

13. Confidence means confidence in the visual hypothesis, not certainty of biological identification.

14. If identification is unsafe or unreliable, prefer "unknown" over a confident guess.

15. If the response language is Arabic, all visible_features, missing_features, scene_description, common_name_ar, and other human-readable descriptive text must be written in Arabic. Scientific names may remain Latin.

16. For Arabic common names, prefer widely used local or regional names when known. Do not use a literal translation if a common established Arabic name is available.

17. Do not include the scientific name in the user-facing Arabic explanation; it is used internally for matching and alias resolution.

18. Return concise, diagnostic visual features rather than generic observations.

19. When the snake could plausibly be a dangerous species, potentially_dangerous must be true for that candidate.

20. If confidence is below 0.45 or key diagnostic anatomy is not visible, needs_better_image should usually be true.

Score values must be numbers from 0.0 to 1.0.

Return ONLY structured JSON matching the required schema.
  `.trim();

    const response =
        await ai.models.generateContent({
            model,

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

                                data:
                                    imageBuffer.toString(
                                        "base64"
                                    ),
                            },
                        },
                    ],
                },
            ],

            config: {
                temperature: 0.1,

                maxOutputTokens: 4000,

                responseMimeType:
                    "application/json",

                responseSchema: {
                    type: "OBJECT",

                    properties: {
                        is_snake: {
                            type: "BOOLEAN",
                        },

                        scene_description: {
                            type: "STRING",
                        },

                        image_quality: {
                            type: "NUMBER",
                        },

                        ambiguity: {
                            type: "NUMBER",
                        },

                        needs_better_image: {
                            type: "BOOLEAN",
                        },

                        best_match: {
                            type: "OBJECT",

                            properties: {
                                scientific_name: {
                                    type: "STRING",
                                },

                                common_name: {
                                    type: "STRING",
                                },

                                common_name_ar: {
                                    type: "STRING",
                                },

                                confidence: {
                                    type: "NUMBER",
                                },

                                potentially_dangerous: {
                                    type: "BOOLEAN",
                                },
                            },

                            required: [
                                "scientific_name",
                                "common_name",
                                "common_name_ar",
                                "confidence",
                                "potentially_dangerous",
                            ],
                        },

                        alternatives: {
                            type: "ARRAY",

                            items: {
                                type: "OBJECT",

                                properties: {
                                    scientific_name: {
                                        type: "STRING",
                                    },

                                    common_name: {
                                        type: "STRING",
                                    },

                                    common_name_ar: {
                                        type: "STRING",
                                    },

                                    confidence: {
                                        type: "NUMBER",
                                    },

                                    potentially_dangerous: {
                                        type: "BOOLEAN",
                                    },
                                },

                                required: [
                                    "scientific_name",
                                    "common_name",
                                    "common_name_ar",
                                    "confidence",
                                    "potentially_dangerous",
                                ],
                            },
                        },

                        visible_features: {
                            type: "ARRAY",

                            items: {
                                type: "STRING",
                            },
                        },

                        missing_features: {
                            type: "ARRAY",

                            items: {
                                type: "STRING",
                            },
                        },
                    },

                    required: [
                        "is_snake",
                        "scene_description",
                        "image_quality",
                        "ambiguity",
                        "needs_better_image",
                        "best_match",
                        "alternatives",
                        "visible_features",
                        "missing_features",
                    ],
                },
            },
        });
    const candidate =
        response.candidates?.[0];

    console.log(
        "Gemini finish reason:",
        candidate?.finishReason
    );

    console.log(
        "Gemini finish message:",
        candidate?.finishMessage || null
    );

    const rawResponse =
        response.text?.trim();

    if (!rawResponse) {
        throw new Error(
            "Gemini returned an empty image analysis"
        );
    }

    let result;

    try {
        result =
            JSON.parse(rawResponse);
    } catch (error) {
        console.error(
            "Invalid Gemini JSON:",
            rawResponse
        );

        throw new Error(
            "Gemini returned invalid structured output"
        );
    }

    result.image_quality =
        clampScore(
            result.image_quality
        );

    result.ambiguity =
        clampScore(
            result.ambiguity
        );

    if (result.best_match) {
        result.best_match.confidence =
            clampScore(
                result.best_match.confidence
            );
    }

    if (
        Array.isArray(
            result.alternatives
        )
    ) {
        result.alternatives =
            result.alternatives
                .map((candidate) => ({
                    ...candidate,

                    confidence:
                        clampScore(
                            candidate.confidence
                        ),
                }))
                .sort(
                    (a, b) =>
                        b.confidence -
                        a.confidence
                );
    }

    const reply =
        buildImageAnalysisReply(
            result,
            language
        );

    return {
        reply,
        analysis: result,
        provider: "GOOGLE_GEMINI",
        model,
    };
}

module.exports = {
    generateAssistantReply,
    analyzeSnakeImage,
};