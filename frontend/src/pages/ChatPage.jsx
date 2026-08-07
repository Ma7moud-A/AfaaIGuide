import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Bot,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

function ChatPage() {
  const messagesEndRef = useRef(null);

  const [conversationId, setConversationId] = useState(null);
  const [anonymousSessionId, setAnonymousSessionId] =
    useState("");

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ASSISTANT",
      message_text:
        "مرحبًا بك في مساعد دليل أفاعي فلسطين. اسألني عن أنواع الأفاعي أو طرق التعامل الآمن معها.",
    },
  ]);

  const [messageText, setMessageText] = useState("");
  const [startingConversation, setStartingConversation] =
    useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let requestCancelled = false;

    async function createConversation() {
      try {
        const response = await axios.post(
          `${API_URL}/chat/conversations`,
          {}
        );

        const responseData =
          response.data?.data || response.data || {};

        const conversation =
          responseData.conversation ||
          responseData.chat_conversation ||
          responseData;

        const newConversationId =
          conversation.id ||
          responseData.conversation_id;

        const newAnonymousSessionId =
          conversation.anonymous_session_id ||
          responseData.anonymous_session_id;

        if (
          !newConversationId ||
          !newAnonymousSessionId
        ) {
          throw new Error(
            "لم يستطع التطبيق إنشاء جلسة محادثة صالحة."
          );
        }

        if (!requestCancelled) {
          setConversationId(newConversationId);
          setAnonymousSessionId(newAnonymousSessionId);
        }
      } catch (requestError) {
        console.error(
          "Failed to create conversation:",
          requestError
        );

        if (!requestCancelled) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "تعذر بدء المحادثة."
          );
        }
      } finally {
        if (!requestCancelled) {
          setStartingConversation(false);
        }
      }
    }

    createConversation();

    return () => {
      requestCancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sendingMessage]);

  async function sendMessage(event) {
    event.preventDefault();

    const trimmedMessage = messageText.trim();

    if (
      !trimmedMessage ||
      !conversationId ||
      !anonymousSessionId ||
      sendingMessage
    ) {
      return;
    }

    const temporaryUserMessage = {
      id: `temporary-${Date.now()}`,
      sender: "USER",
      message_text: trimmedMessage,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      temporaryUserMessage,
    ]);

    setMessageText("");
    setError("");
    setSendingMessage(true);

    try {
      const response = await axios.post(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        {
          message_text: trimmedMessage,
          anonymous_session_id: anonymousSessionId,
        }
      );

      const responseData =
        response.data?.data || response.data || {};

      const userMessage =
        responseData.user_message ||
        responseData.message;

      const assistantMessage =
        responseData.assistant_message ||
        responseData.reply_message;

      const assistantReply =
        assistantMessage?.message_text ||
        assistantMessage?.text ||
        responseData.reply;

      setMessages((currentMessages) => {
        const messagesWithoutTemporary =
          currentMessages.filter(
            (message) =>
              message.id !== temporaryUserMessage.id
          );

        const nextMessages = [
          ...messagesWithoutTemporary,
          userMessage || temporaryUserMessage,
        ];

        if (assistantMessage) {
          nextMessages.push(assistantMessage);
        } else if (assistantReply) {
          nextMessages.push({
            id: `assistant-${Date.now()}`,
            sender: "ASSISTANT",
            message_text: assistantReply,
          });
        }

        return nextMessages;
      });
    } catch (requestError) {
      console.error(
        "Failed to send chat message:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "تعذر إرسال الرسالة. حاول مرة أخرى."
      );
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <main className="chat-page">
      <section className="chat-page__hero">
        <div className="page-container chat-page__hero-content">
          <div>
            <span className="eyebrow">
              <Sparkles size={18} />
              مساعد مدعوم بالذكاء الاصطناعي
            </span>

            <h1>اسأل المساعد</h1>

            <p>
              اطرح أسئلتك عن الأفاعي، واحصل على إجابات
              وتوجيهات أولية للسلامة.
            </p>
          </div>

          <div className="chat-page__hero-icon">
            <MessageCircle size={47} />
          </div>
        </div>
      </section>

      <section className="page-container chat-page__content">
        <div className="chat-warning">
          <ShieldAlert size={22} />

          <p>
            <strong>تنبيه:</strong> إجابات المساعد توعوية
            وتقريبية، ولا تغني عن التواصل مع خبير أو خدمات
            الطوارئ عند وجود خطر مباشر.
          </p>
        </div>

        <div className="chat-layout">
          <section className="chat-window">
            <header className="chat-window__header">
              <div className="chat-assistant-avatar">
                <Bot size={25} />
              </div>

              <div>
                <h2>مساعد Afaai Guide</h2>

                <span>
                  <i />
                  متصل الآن
                </span>
              </div>
            </header>

            <div className="chat-messages">
              {startingConversation && (
                <div className="chat-starting">
                  <LoaderCircle
                    className="spinning-icon"
                    size={25}
                  />
                  جاري تجهيز المحادثة...
                </div>
              )}

              {messages.map((message) => {
                const isUser =
                  message.sender === "USER";

                return (
                  <div
                    key={message.id}
                    className={`chat-message ${
                      isUser
                        ? "chat-message--user"
                        : "chat-message--assistant"
                    }`}
                  >
                    <div className="chat-message__avatar">
                      {isUser ? (
                        <User size={19} />
                      ) : (
                        <Bot size={19} />
                      )}
                    </div>

                    <div className="chat-message__bubble">
                      {message.message_text
                        ?.split("\n")
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  </div>
                );
              })}

              {sendingMessage && (
                <div className="chat-message chat-message--assistant">
                  <div className="chat-message__avatar">
                    <Bot size={19} />
                  </div>

                  <div className="chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="chat-error">
                <ShieldAlert size={19} />
                {error}
              </div>
            )}

            <form
              className="chat-composer"
              onSubmit={sendMessage}
            >
              <button
                type="button"
                className="chat-composer__image"
                title="تحليل صورة"
                onClick={() => {
                  window.location.href = "/identify";
                }}
              >
                <ImagePlus size={21} />
              </button>

              <textarea
                value={messageText}
                rows="1"
                maxLength="1000"
                placeholder="اكتب رسالتك هنا..."
                disabled={
                  startingConversation ||
                  sendingMessage ||
                  !conversationId
                }
                onChange={(event) =>
                  setMessageText(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendMessage(event);
                  }
                }}
              />

              <button
                type="submit"
                className="chat-composer__send"
                disabled={
                  !messageText.trim() ||
                  startingConversation ||
                  sendingMessage ||
                  !conversationId
                }
              >
                {sendingMessage ? (
                  <LoaderCircle
                    className="spinning-icon"
                    size={21}
                  />
                ) : (
                  <Send size={21} />
                )}
              </button>
            </form>
          </section>

          <aside className="chat-sidebar">
            <div className="chat-sidebar__icon">
              <Bot size={30} />
            </div>

            <h2>كيف يمكن للمساعد خدمتك؟</h2>

            <p>
              يمكنك سؤاله عن الأنواع، السمّية، السلوك،
              والتعليمات الأولية عند مشاهدة أفعى.
            </p>

            <div className="chat-suggestions">
              {[
                "ما أخطر الأفاعي في فلسطين؟",
                "ماذا أفعل إذا رأيت أفعى قرب المنزل؟",
                "كيف أميز بين الأفعى السامة وغير السامة؟",
                "ما الإسعافات الأولية بعد لدغة أفعى؟",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={
                    startingConversation ||
                    sendingMessage
                  }
                  onClick={() =>
                    setMessageText(suggestion)
                  }
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default ChatPage;