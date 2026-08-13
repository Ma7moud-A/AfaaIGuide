const crypto = require("crypto");
const pool = require("../config/db");

const {
    analyzeSnakeImage,
} = require("../services/aiService");

const {
    saveImageLocally,
    deleteLocalImage,
} = require("../services/storageService");

const {
    generateAssistantReply: generateAIReply,
} = require("../services/aiService");

// this function will be only used when Gemini AI does not work 

function generateFallbackReply(messageText) {
    const normalizedMessage = messageText.toLowerCase();

    const emergencyKeywords = [
        "bite",
        "bitten",
        "عضتني",
        "لدغتني",
        "لدغة",
        "انلدغت",
    ];

    const imageKeywords = [
        "image",
        "photo",
        "picture",
        "صورة",
        "صوره",
    ];

    const sawSnakeKeywords = [
        "snake",
        "أفعى",
        "افعى",
        "حية",
        "ثعبان",
    ];

    if (
        emergencyKeywords.some((keyword) =>
            normalizedMessage.includes(keyword)
        )
    ) {
        return {
            reply:
                "ابتعد عن الأفعى فورًا واطلب المساعدة الطبية العاجلة. لا تحاول مص السم، ولا تقطع موضع اللدغة، ولا تضع رباطًا ضاغطًا. حاول البقاء هادئًا وتقليل الحركة.",
            riskLevel: "EMERGENCY",
        };
    }

    if (
        imageKeywords.some((keyword) =>
            normalizedMessage.includes(keyword)
        )
    ) {
        return {
            reply:
                "يمكنك إرفاق صورة واضحة للأفعى من مسافة آمنة. لا تقترب منها ولا تحاول الإمساك بها من أجل التصوير.",
            riskLevel: "NORMAL",
        };
    }

    if (
        sawSnakeKeywords.some((keyword) =>
            normalizedMessage.includes(keyword)
        )
    ) {
        return {
            reply:
                "حافظ على مسافة آمنة، ولا تحاول لمس الأفعى أو قتلها أو الإمساك بها. أبعد الأطفال والحيوانات الأليفة عن المكان، ويمكنك إرسال صورة من مسافة آمنة للمساعدة في التعرف عليها.",
            riskLevel: "NORMAL",
        };
    }

    return {
        reply:
            "أنا مساعد متخصص في إرشادات الأفاعي. صف ما شاهدته أو أرسل صورة واضحة من مسافة آمنة، وسأحاول مساعدتك.",
        riskLevel: "EDUCATIONAL",
    };
}

async function createConversation(req, res) {
    const requestStartedAt = Date.now();

    try {
        const userId = req.user?.id || null;

        let anonymousSessionId = null;

        if (!userId) {
            anonymousSessionId =
                req.body.anonymous_session_id || crypto.randomUUID();
        }

        const result = await pool.query(
            `
      INSERT INTO chat_conversations (
        user_id,
        anonymous_session_id,
        status,
        risk_level
      )
      VALUES ($1, $2, 'ACTIVE', 'UNKNOWN')
      RETURNING
        id,
        user_id,
        anonymous_session_id,
        status,
        risk_level,
        created_at,
        last_message_at;
      `,
            [userId, anonymousSessionId]
        );

        return res.status(201).json({
            success: true,
            message: "Conversation created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating conversation:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create conversation",
        });
    }
}
async function sendMessage(req, res) {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { message_text, anonymous_session_id } = req.body;

        const userId = req.user?.id || null;

        if (
            !message_text ||
            typeof message_text !== "string" ||
            message_text.trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "message_text is required",
            });
        }

        await client.query("BEGIN");

        const conversationResult = await client.query(
            `
      SELECT
        id,
        user_id,
        anonymous_session_id,
        status
      FROM chat_conversations
      WHERE id = $1;
      `,
            [id]
        );

        if (conversationResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const conversation = conversationResult.rows[0];

        if (conversation.status !== "ACTIVE") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Conversation is not active",
            });
        }

        const belongsToUser =
            userId && conversation.user_id === userId;

        const belongsToAnonymousSession =
            !userId &&
            anonymous_session_id &&
            conversation.anonymous_session_id === anonymous_session_id;

        if (!belongsToUser && !belongsToAnonymousSession) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                message: "You do not have access to this conversation",
            });
        }

        const userMessageResult = await client.query(
            `
      INSERT INTO chat_messages (
        conversation_id,
        sender,
        message_text,
        metadata
      )
      VALUES ($1, 'USER', $2, '{}'::jsonb)
      RETURNING
        id,
        conversation_id,
        sender,
        message_text,
        metadata,
        created_at;
      `,
            [id, message_text.trim()]
        );

        let assistantResponse;
        let responseMetadata;

        try {
            const aiResponse = await generateAIReply(
                message_text.trim()
            );

            assistantResponse = {
                reply: aiResponse.reply,
                riskLevel: "UNKNOWN",
            };

            responseMetadata = {
                response_type: "AI_GENERATED",
                provider: aiResponse.provider,
                model: aiResponse.model,
                risk_level: assistantResponse.riskLevel,
            };
        } catch (aiError) {
            console.error("Gemini request failed:", aiError.message);

            assistantResponse = generateFallbackReply(
                message_text.trim()
            );

            responseMetadata = {
                response_type: "RULE_BASED_FALLBACK",
                provider: "LOCAL_FALLBACK",
                model: null,
                risk_level: assistantResponse.riskLevel,
                fallback_reason: "AI provider unavailable",
            };
        }

        const assistantMessageResult = await client.query(
            `
      INSERT INTO chat_messages (
        conversation_id,
        sender,
        message_text,
        metadata
      )
      VALUES (
        $1,
        'ASSISTANT',
        $2,
        $3::jsonb
      )
      RETURNING
        id,
        conversation_id,
        sender,
        message_text,
        metadata,
        created_at;
      `,
            [
                id,
                assistantResponse.reply,
                JSON.stringify(responseMetadata),
            ]
        );

        await client.query(
            `
      UPDATE chat_conversations
      SET
        last_message_at = CURRENT_TIMESTAMP,
        risk_level = $2
      WHERE id = $1;
      `,
            [id, assistantResponse.riskLevel]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Message processed successfully",
            data: {
                user_message: userMessageResult.rows[0],
                assistant_message: assistantMessageResult.rows[0],
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error sending message:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to process message",
        });
    } finally {
        client.release();
    }
}
async function getConversationMessages(req, res) {
    try {
        const { id } = req.params;
        const { anonymous_session_id } = req.query;

        const userId = req.user?.id || null;

        const conversationResult = await pool.query(
            `
      SELECT
        id,
        user_id,
        anonymous_session_id,
        status,
        risk_level,
        created_at,
        last_message_at
      FROM chat_conversations
      WHERE id = $1;
      `,
            [id]
        );

        if (conversationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const conversation = conversationResult.rows[0];

        const belongsToUser =
            userId !== null &&
            conversation.user_id === userId;

        const belongsToAnonymousSession =
            userId === null &&
            anonymous_session_id &&
            conversation.anonymous_session_id === anonymous_session_id;

        if (!belongsToUser && !belongsToAnonymousSession) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this conversation",
            });
        }

        const messagesResult = await pool.query(
            `
      SELECT
        id,
        conversation_id,
        sender,
        message_text,
        metadata,
        created_at
      FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, id ASC;
      `,
            [id]
        );

        return res.status(200).json({
            success: true,
            conversation,
            count: messagesResult.rows.length,
            data: messagesResult.rows,
        });
    } catch (error) {
        console.error("Error fetching conversation messages:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversation messages",
        });
    }
}

async function sendImageMessage(req, res) {
    const requestStartedAt = Date.now();

    let savedImage = null;
    const client = await pool.connect();

    try {
        const { id } = req.params;

        const {
            anonymous_session_id,
            message_text = "",
        } = req.body;

        const userId = req.user?.id || null;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "An image file is required",
            });
        }

        /*
         * 1. We verify that the conversation exists and that the requester
         * has permission to access it.
         */
        const conversationResult = await client.query(
            `
      SELECT
        id,
        user_id,
        anonymous_session_id,
        status
      FROM chat_conversations
      WHERE id = $1;
      `,
            [id]
        );

        if (conversationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const conversation = conversationResult.rows[0];

        if (conversation.status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: "Conversation is not active",
            });
        }

        const belongsToUser =
            userId !== null &&
            conversation.user_id === userId;

        const belongsToAnonymousSession =
            userId === null &&
            anonymous_session_id &&
            conversation.anonymous_session_id ===
            anonymous_session_id;

        if (!belongsToUser && !belongsToAnonymousSession) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this conversation",
            });
        }

        /*
         * 2. We process the image and store a WebP copy locally.
         */
        savedImage = await saveImageLocally(
            req.file.buffer
        );

        const imageProcessedAt = Date.now();

        console.log(
            `Image processing took ${imageProcessedAt - requestStartedAt
            } ms`
        );

        const processedImageBuffer =
            savedImage.processedBuffer;

        /*
         * 3. We send the processed version to Gemini.
         */

        const aiStartedAt = Date.now();

        let aiResponse;
        let responseMetadata;

        try {
            aiResponse = await analyzeSnakeImage(
                processedImageBuffer,
                savedImage.mimeType,
                message_text
            );

            const aiFinishedAt = Date.now();

            console.log(
                `Gemini image analysis took ${aiFinishedAt - aiStartedAt
                } ms`
            );

            responseMetadata = {
                response_type: "AI_IMAGE_ANALYSIS",
                provider: aiResponse.provider,
                model: aiResponse.model,
            };
        } catch (aiError) {
            console.error(
                "Gemini image analysis failed:",
                aiError.message
            );

            aiResponse = {
                reply:
                    "تعذر تحليل الصورة حاليًا. حافظ على مسافة آمنة، ولا تلمس الأفعى أو تحاول الإمساك بها، وحاول التواصل مع خبير محلي مؤهل.",
            };

            responseMetadata = {
                response_type: "IMAGE_ANALYSIS_FALLBACK",
                provider: "LOCAL_FALLBACK",
                model: null,
                fallback_reason: "AI provider unavailable",
            };
        }

        /*
         * 4. We store the image data and messages within a transaction.
         */
        await client.query("BEGIN");

        const mediaResult = await client.query(
            `
      INSERT INTO media_assets (
        storage_key,
        original_filename,
        mime_type,
        size_bytes,
        width,
        height,
        visibility,
        uploaded_by
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, 'PRIVATE', $7
      )
      RETURNING
        id,
        storage_key,
        original_filename,
        mime_type,
        size_bytes,
        width,
        height,
        visibility,
        uploaded_by,
        created_at;
      `,
            [
                savedImage.storageKey,
                req.file.originalname,
                savedImage.mimeType,
                savedImage.sizeBytes,
                savedImage.width,
                savedImage.height,
                userId,
            ]
        );

        const mediaAsset = mediaResult.rows[0];

        const userMessageText =
            message_text.trim() ||
            "The user uploaded an image for snake identification.";

        const userMessageResult = await client.query(
            `
      INSERT INTO chat_messages (
        conversation_id,
        sender,
        message_text,
        metadata
      )
      VALUES ($1, 'USER', $2, $3::jsonb)
      RETURNING
        id,
        conversation_id,
        sender,
        message_text,
        metadata,
        created_at;
      `,
            [
                id,
                userMessageText,
                JSON.stringify({
                    content_type: "IMAGE",
                    media_asset_id: mediaAsset.id,
                    storage_key: mediaAsset.storage_key,
                    mime_type: mediaAsset.mime_type,
                }),
            ]
        );

        const assistantMessageResult = await client.query(
            `
      INSERT INTO chat_messages (
        conversation_id,
        sender,
        message_text,
        metadata
      )
      VALUES ($1, 'ASSISTANT', $2, $3::jsonb)
      RETURNING
        id,
        conversation_id,
        sender,
        message_text,
        metadata,
        created_at;
      `,
            [
                id,
                aiResponse.reply,
                JSON.stringify({
                    ...responseMetadata,
                    source_media_asset_id: mediaAsset.id,
                    risk_level: "UNKNOWN",
                }),
            ]
        );

        await client.query(
            `
      UPDATE chat_conversations
      SET
        last_message_at = CURRENT_TIMESTAMP,
        risk_level = 'UNKNOWN'
      WHERE id = $1;
      `,
            [id]
        );

        await client.query("COMMIT");

        console.log(
            `Full image request took ${Date.now() - requestStartedAt
            } ms`
        );

        return res.status(201).json({
            success: true,
            message: "Image processed successfully",
            data: {
                media_asset: mediaAsset,
                user_message: userMessageResult.rows[0],
                assistant_message:
                    assistantMessageResult.rows[0],
            },
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // We do nothing if the transaction has not started.
        }

        if (savedImage?.storageKey) {
            try {
                await deleteLocalImage(
                    savedImage.storageKey
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to remove stored image:",
                    cleanupError.message
                );
            }
        }

        console.error(
            "Error processing image message:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.statusCode === 400
                    ? error.message
                    : "Failed to process image",
        });
    } finally {
        client.release();
    }
}

module.exports = {
    createConversation,
    sendMessage,
    getConversationMessages,
    sendImageMessage,
};
