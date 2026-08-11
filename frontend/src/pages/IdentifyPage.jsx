import { useRef, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { API_URL } from "../config/api";

function IdentifyPage() {
  const inputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [messageText, setMessageText] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [error, setError] = useState("");

  const isAnalyzing = analysisStage !== "";

  function validateFile(file) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "يُسمح فقط بصور JPEG أو PNG أو WebP.";
    }

    if (file.size > 8 * 1024 * 1024) {
      return "يجب ألا يتجاوز حجم الصورة 8 ميجابايت.";
    }

    return "";
  }

  function chooseFile(file) {
    if (!file) {
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult("");
    setError("");
  }

  function handleFileInput(event) {
    chooseFile(event.target.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);

    chooseFile(event.dataTransfer.files?.[0]);
  }

  function removeImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setAnalysisResult("");
    setError("");
    setAnalysisStage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function extractConversationData(response) {
    const data = response.data?.data || response.data || {};

    const conversation =
      data.conversation ||
      data.chat_conversation ||
      data;

    return {
      conversationId:
        conversation.id ||
        data.conversation_id,

      anonymousSessionId:
        conversation.anonymous_session_id ||
        data.anonymous_session_id,
    };
  }

  async function analyzeImage() {
    if (!selectedFile || isAnalyzing) {
      return;
    }

    setError("");
    setAnalysisResult("");

    try {
      setAnalysisStage("جاري إنشاء جلسة التحليل...");

      const conversationResponse = await axios.post(
        `${API_URL}/chat/conversations`,
        {}
      );

      const {
        conversationId,
        anonymousSessionId,
      } = extractConversationData(conversationResponse);

      if (!conversationId || !anonymousSessionId) {
        throw new Error(
          "لم يستطع التطبيق إنشاء جلسة تحليل صالحة."
        );
      }

      setAnalysisStage("جاري تجهيز الصورة ورفعها...");

      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append(
        "message_text",
        messageText.trim() ||
          "حلّل هذه الصورة وحدد نوع الأفعى المحتمل مع تعليمات السلامة."
      );
      formData.append(
        "anonymous_session_id",
        anonymousSessionId
      );

      setAnalysisStage(
        "يحلل Gemini الصورة الآن، قد يستغرق ذلك عدة ثوانٍ..."
      );

      const analysisResponse = await axios.post(
        `${API_URL}/chat/conversations/${conversationId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData =
        analysisResponse.data?.data || {};

      const assistantMessage =
        responseData.assistant_message ||
        responseData.message ||
        {};

      const reply =
        assistantMessage.message_text ||
        assistantMessage.text ||
        responseData.reply;

      if (!reply) {
        throw new Error(
          "تم تحليل الصورة لكن لم تصل نتيجة نصية."
        );
      }

      setAnalysisResult(reply);
    } catch (requestError) {
      console.error(
        "Image analysis failed:",
        requestError
      );

      const responseMessage =
        requestError.response?.data?.message;

      setError(
        responseMessage ||
          requestError.message ||
          "تعذر تحليل الصورة حاليًا. حاول مرة أخرى."
      );
    } finally {
      setAnalysisStage("");
    }
  }

  return (
    <main className="identify-page">
      <section className="identify-hero">
        <div className="page-container identify-hero__content">
          <div className="reveal">
            <span className="eyebrow">
              <Sparkles size={18} />
              تحليل مدعوم بالذكاء الاصطناعي
            </span>

            <h1>تعرّف على الأفعى من صورتها</h1>

            <p>
              ارفع صورة واضحة التقطتها من مسافة آمنة،
              وسيقوم النظام بتقديم تحليل أولي وتعليمات
              مناسبة للتعامل مع الحالة.
            </p>
          </div>

          <div className="identify-hero__icon reveal">
            <ImagePlus size={48} />
          </div>
        </div>
      </section>

      <section className="page-container identify-content">
        <div className="identify-warning reveal">
          <ShieldAlert size={24} />

          <div>
            <strong>السلامة أهم من الصورة</strong>

            <p>
              لا تقترب من الأفعى لتصويرها. استخدم التكبير،
              ولا تحاول لمسها أو الإمساك بها تحت أي ظرف.
            </p>
          </div>
        </div>

        <div className="identify-layout">
          <section className="identify-upload-card reveal">
            <div className="identify-card-heading">
              <span>1</span>

              <div>
                <h2>ارفع صورة الأفعى</h2>
                <p>
                  JPEG أو PNG أو WebP، وبحجم أقصى 8 MB.
                </p>
              </div>
            </div>

            {!selectedFile ? (
              <button
                type="button"
                className={`image-dropzone ${
                  dragActive ? "is-active" : ""
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="image-dropzone__icon">
                  <UploadCloud size={37} />
                </div>

                <strong>
                  اسحب الصورة إلى هنا أو اضغط لاختيارها
                </strong>

                <span>
                  اختر صورة واضحة تُظهر جسم الأفعى ونقوشها
                </span>
              </button>
            ) : (
              <div className="image-preview">
                <img
                  src={previewUrl}
                  alt="معاينة صورة الأفعى المختارة"
                />

                <div className="image-preview__overlay">
                  <button
                    type="button"
                    onClick={() =>
                      inputRef.current?.click()
                    }
                  >
                    <RefreshCw size={18} />
                    تغيير الصورة
                  </button>

                  <button
                    type="button"
                    className="image-preview__delete"
                    onClick={removeImage}
                  >
                    <Trash2 size={18} />
                    حذف
                  </button>
                </div>

                <div className="image-preview__info">
                  <strong>{selectedFile.name}</strong>

                  <span>
                    {(
                      selectedFile.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </span>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileInput}
            />

            <label
              className="identify-note"
              htmlFor="analysis-note"
            >
              <span>ملاحظة إضافية — اختيارية</span>

              <textarea
                id="analysis-note"
                value={messageText}
                rows="4"
                maxLength="500"
                placeholder="مثال: شاهدت الأفعى قرب المنزل، وكان طولها حوالي متر..."
                onChange={(event) =>
                  setMessageText(event.target.value)
                }
              />

              <small>
                {messageText.length}/500
              </small>
            </label>

            {error && (
              <div className="identify-error">
                <AlertTriangle size={21} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="button"
              className="button button--primary identify-submit"
              disabled={!selectedFile || isAnalyzing}
              onClick={analyzeImage}
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle
                    className="spinning-icon"
                    size={20}
                  />
                  جاري التحليل
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  ابدأ تحليل الصورة
                </>
              )}
            </button>
          </section>

          <aside className="identify-side-panel reveal">
            <div className="identify-side-panel__heading">
              <Bot size={25} />

              <div>
                <h2>نتيجة التحليل</h2>
                <p>
                  ستظهر نتيجة Gemini هنا بعد رفع الصورة.
                </p>
              </div>
            </div>

            {!isAnalyzing && !analysisResult && (
              <div className="analysis-empty">
                <div className="analysis-empty__icon">
                  <Sparkles size={35} />
                </div>

                <h3>النتيجة بانتظار الصورة</h3>

                <p>
                  اختر صورة واضحة، ثم اضغط على زر بدء
                  التحليل.
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="analysis-loading">
                <div className="analysis-loader">
                  <LoaderCircle size={44} />
                </div>

                <h3>جاري تحليل الصورة</h3>

                <p>{analysisStage}</p>

                <div className="analysis-progress">
                  <span />
                </div>
              </div>
            )}

            {!isAnalyzing && analysisResult && (
              <div className="analysis-result">
                <div className="analysis-result__success">
                  <CheckCircle2 size={22} />

                  <div>
                    <strong>اكتمل التحليل الأولي</strong>
                    <span>
                      راجع النتيجة والتعليمات بعناية
                    </span>
                  </div>
                </div>

                <div className="analysis-result__text">
                  {analysisResult
                    .split("\n")
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>

                <div className="analysis-result__warning">
                  <ShieldAlert size={20} />

                  <p>
                    النتيجة تقريبية وليست تأكيدًا نهائيًا
                    للنوع. حافظ على مسافة آمنة دائمًا.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default IdentifyPage;