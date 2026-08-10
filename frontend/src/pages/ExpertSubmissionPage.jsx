import { useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("afaai_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function ExpertSubmissionPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const user = getStoredUser();
  const token = localStorage.getItem("afaai_token");

  const isExpert = useMemo(() => {
    return user?.roles?.some((role) =>
      ["EXPERT", "ADMIN"].includes(role)
    );
  }, [user]);

  const [formData, setFormData] = useState({
    arabic_name: "",
    venom_status: "UNKNOWN",
    minimum_size_cm: "",
    maximum_size_cm: "",
    habitat_expert_notes: "",
    behavior_expert_notes: "",
    expert_notes: "",
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validateImage(file) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: نوع الصورة غير مدعوم.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: حجم الصورة أكبر من 8 MB.`;
    }

    return "";
  }

  function addImages(files) {
    const filesArray = Array.from(files || []);

    if (!filesArray.length) {
      return;
    }

    if (
      selectedImages.length + filesArray.length >
      MAX_IMAGES
    ) {
      setError(`يمكن رفع ${MAX_IMAGES} صور كحد أقصى.`);
      return;
    }

    for (const file of filesArray) {
      const validationError = validateImage(file);

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const newImages = filesArray.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedImages((current) => [
      ...current,
      ...newImages,
    ]);

    setError("");
  }

  function handleFileInput(event) {
    addImages(event.target.files);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
    addImages(event.dataTransfer.files);
  }

  function removeImage(imageId) {
    setSelectedImages((current) => {
      const imageToRemove = current.find(
        (image) => image.id === imageId
      );

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return current.filter(
        (image) => image.id !== imageId
      );
    });
  }

  function resetForm() {
    selectedImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    setFormData({
      arabic_name: "",
      venom_status: "UNKNOWN",
      minimum_size_cm: "",
      maximum_size_cm: "",
      habitat_expert_notes: "",
      behavior_expert_notes: "",
      expert_notes: "",
    });

    setSelectedImages([]);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError("يجب تسجيل الدخول أولًا.");
      return;
    }

    if (!formData.arabic_name.trim()) {
      setError("اسم الأفعى باللغة العربية مطلوب.");
      return;
    }

    if (selectedImages.length === 0) {
      setError("يجب رفع صورة واحدة على الأقل.");
      return;
    }

    const minimumSize = formData.minimum_size_cm
      ? Number(formData.minimum_size_cm)
      : null;

    const maximumSize = formData.maximum_size_cm
      ? Number(formData.maximum_size_cm)
      : null;

    if (
      minimumSize !== null &&
      maximumSize !== null &&
      maximumSize <= minimumSize
    ) {
      setError(
        "يجب أن يكون الحد الأقصى للطول أكبر من الحد الأدنى."
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const requestData = new FormData();

      requestData.append(
        "arabic_name",
        formData.arabic_name.trim()
      );

      requestData.append(
        "venom_status",
        formData.venom_status
      );

      if (formData.minimum_size_cm) {
        requestData.append(
          "minimum_size_cm",
          formData.minimum_size_cm
        );
      }

      if (formData.maximum_size_cm) {
        requestData.append(
          "maximum_size_cm",
          formData.maximum_size_cm
        );
      }

      if (formData.habitat_notes.trim()) {
        requestData.append(
          "habitat_notes",
          formData.habitat_notes.trim()
        );
      }

      if (formData.behavior_notes.trim()) {
        requestData.append(
          "behavior_notes",
          formData.behavior_notes.trim()
        );
      }

      if (formData.expert_notes.trim()) {
        requestData.append(
          "expert_notes",
          formData.expert_notes.trim()
        );
      }

      selectedImages.forEach((image) => {
        requestData.append("images", image.file);
      });

      const response = await axios.post(
        `${API_URL}/expert/species-submissions`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData =
        response.data?.data || response.data;

      setSuccess(responseData);
      resetForm();
    } catch (requestError) {
      console.error(
        "Expert submission failed:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "تعذر إرسال الاقتراح. حاول مرة أخرى."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || !user) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <LockKeyhole size={45} />

          <h1>تسجيل الدخول مطلوب</h1>

          <p>
            يجب تسجيل الدخول بحساب خبير للوصول إلى هذه
            الصفحة.
          </p>

          <Link
            className="button button--primary"
            to="/login"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  if (!isExpert) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

          <h1>هذه الصفحة مخصصة للخبراء</h1>

          <p>
            حسابك الحالي لا يمتلك صلاحية إرسال اقتراحات
            الأنواع.
          </p>

          <Link
            className="button button--primary"
            to="/"
          >
            <ArrowRight size={18} />
            العودة إلى الرئيسية
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="expert-submission-page">
      <section className="expert-page-hero">
        <div className="page-container expert-page-hero__content">
          <div>
            <span className="eyebrow">
              <ShieldCheck size={18} />
              مساحة الخبراء
            </span>

            <h1>اقتراح أفعى جديدة</h1>

            <p>
              أرسل الاسم العربي وصورًا واضحة، وسيقوم مدير
              المحتوى بمراجعة المعلومات واستكمالها قبل النشر.
            </p>
          </div>

          <div className="expert-page-hero__icon">
            <Plus size={45} />
          </div>
        </div>
      </section>

      <section className="page-container expert-form-layout">
        <form
          className="expert-submission-form"
          onSubmit={handleSubmit}
        >
          <div className="expert-form-heading">
            <div>
              <span>1</span>
            </div>

            <div>
              <h2>المعلومات الأساسية</h2>
              <p>
                الاسم العربي والصور مطلوبان، وبقية الحقول
                اختيارية.
              </p>
            </div>
          </div>

          <div className="expert-fields-grid">
            <label className="expert-field expert-field--full">
              <span>
                اسم الأفعى بالعربية
                <strong>*</strong>
              </span>

              <input
                name="arabic_name"
                type="text"
                value={formData.arabic_name}
                maxLength="150"
                placeholder="مثال: الأفعى المقرنة"
                disabled={submitting}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field">
              <span>حالة السمّية</span>

              <select
                name="venom_status"
                value={formData.venom_status}
                disabled={submitting}
                onChange={handleChange}
              >
                <option value="UNKNOWN">
                  غير معروفة
                </option>
                <option value="VENOMOUS">سامة</option>
                <option value="MILDLY_VENOMOUS">
                  سامة بدرجة خفيفة
                </option>
                <option value="NON_VENOMOUS">
                  غير سامة
                </option>
              </select>
            </label>

            <label className="expert-field">
              <span>الموطن أو منطقة الانتشار</span>

              <input
                name="habitat_notes"
                type="text"
                value={formData.habitat_notes}
                maxLength="300"
                placeholder="مثال: المناطق الصحراوية والصخرية"
                disabled={submitting}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field">
              <span>الحد الأدنى للطول — سم</span>

              <input
                name="minimum_size_cm"
                type="number"
                min="1"
                step="0.1"
                value={formData.minimum_size_cm}
                placeholder="مثال: 40"
                disabled={submitting}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field">
              <span>الحد الأقصى للطول — سم</span>

              <input
                name="maximum_size_cm"
                type="number"
                min="1"
                step="0.1"
                value={formData.maximum_size_cm}
                placeholder="مثال: 90"
                disabled={submitting}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field expert-field--full">
              <span>السلوك العام</span>

              <textarea
                name="behavior_notes"
                rows="4"
                value={formData.behavior_notes}
                maxLength="1500"
                placeholder="اكتب ملاحظات مختصرة عن نشاطها وسلوكها..."
                disabled={submitting}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field expert-field--full">
              <span>ملاحظات إضافية</span>

              <textarea
                name="expert_notes"
                rows="4"
                value={formData.expert_notes}
                maxLength="2000"
                placeholder="أي معلومات تساعد مدير المحتوى في مراجعة الاقتراح..."
                disabled={submitting}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="expert-form-heading expert-images-heading">
            <div>
              <span>2</span>
            </div>

            <div>
              <h2>صور الأفعى</h2>
              <p>
                ارفع من صورة واحدة إلى خمس صور واضحة.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`expert-image-dropzone ${
              dragActive ? "is-active" : ""
            }`}
            disabled={
              submitting ||
              selectedImages.length >= MAX_IMAGES
            }
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud size={38} />

            <strong>
              اسحب الصور إلى هنا أو اضغط لاختيارها
            </strong>

            <span>
              JPEG أو PNG أو WebP — بحد أقصى 8 MB للصورة
            </span>

            <small>
              {selectedImages.length}/{MAX_IMAGES} صور
            </small>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFileInput}
          />

          {selectedImages.length > 0 && (
            <div className="expert-images-preview">
              {selectedImages.map((image, index) => (
                <article
                  key={image.id}
                  className="expert-image-preview"
                >
                  <img
                    src={image.previewUrl}
                    alt={`صورة الاقتراح ${index + 1}`}
                  />

                  <span>{index + 1}</span>

                  <button
                    type="button"
                    title="حذف الصورة"
                    disabled={submitting}
                    onClick={() =>
                      removeImage(image.id)
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}

              {selectedImages.length < MAX_IMAGES && (
                <button
                  type="button"
                  className="expert-add-image"
                  disabled={submitting}
                  onClick={() =>
                    inputRef.current?.click()
                  }
                >
                  <ImagePlus size={25} />
                  إضافة صورة
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="expert-form-message expert-form-message--error">
              <AlertTriangle size={21} />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="expert-form-message expert-form-message--success">
              <CheckCircle2 size={22} />

              <div>
                <strong>تم إرسال الاقتراح بنجاح</strong>
                <p>
                  رقم الاقتراح:{" "}
                  {success.submission?.id ||
                    success.id ||
                    "تم الحفظ"}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="button button--primary expert-submit-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="spinning-icon"
                  size={20}
                />
                جاري رفع الصور وإرسال الاقتراح...
              </>
            ) : (
              <>
                <Send size={20} />
                إرسال الاقتراح للمراجعة
              </>
            )}
          </button>
        </form>

        <aside className="expert-form-sidebar">
          <div className="expert-form-sidebar__icon">
            <ShieldCheck size={32} />
          </div>

          <h2>إرشادات إرسال الاقتراح</h2>

          <div className="expert-guidelines">
            <div>
              <CheckCircle2 size={18} />
              <p>
                استخدم الاسم العربي المعروف للنوع قدر
                الإمكان.
              </p>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <p>
                اختر صورًا واضحة تُظهر الرأس والجسم
                والنقوش.
              </p>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <p>
                اذكر المعلومات التي تعرفها فقط، واترك غير
                المؤكد فارغًا.
              </p>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <p>
                لن يظهر الاقتراح للعامة قبل مراجعته
                واعتماده.
              </p>
            </div>
          </div>

          <div className="expert-review-flow">
            <strong>مسار المراجعة</strong>

            <span>اقتراح الخبير</span>
            <i />
            <span>مراجعة المحتوى</span>
            <i />
            <span>النشر في الدليل</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default ExpertSubmissionPage;