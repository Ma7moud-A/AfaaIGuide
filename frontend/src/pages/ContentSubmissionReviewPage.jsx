import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileSearch,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Rocket,
  Ruler,
  ShieldCheck,
  Skull,
  UserRound,
  XCircle,
} from "lucide-react";
import { API_URL, BACKEND_URL } from "../config/api";

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("afaai_user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function getStatusInfo(status) {
  switch (status) {
    case "APPROVED":
      return {
        label: "مقبول",
        className: "approved",
        icon: CheckCircle2,
      };

    case "PUBLISHED":
      return {
        label: "منشور",
        className: "published",
        icon: BookOpen,
      };

    case "REJECTED":
      return {
        label: "مرفوض",
        className: "rejected",
        icon: XCircle,
      };

    case "UNDER_REVIEW":
      return {
        label: "قيد المراجعة",
        className: "review",
        icon: FileSearch,
      };

    case "SUBMITTED":
    default:
      return {
        label: "بانتظار المراجعة",
        className: "pending",
        icon: Clock3,
      };
  }
}

function getVenomLabel(status) {
  switch (status) {
    case "VENOMOUS":
      return "سامة";

    case "MILDLY_VENOMOUS":
      return "سامة بدرجة خفيفة";

    case "NON_VENOMOUS":
      return "غير سامة";

    default:
      return "غير معروفة";
  }
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "غير معروف";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "غير معروف";
  }

  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ContentSubmissionReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = getStoredUser();
  const token = localStorage.getItem("afaai_token");

  const isContentAdmin = useMemo(() => {
    return user?.roles?.some((role) =>
      ["CONTENT_ADMIN", "ADMIN"].includes(role),
    );
  }, [user]);

  const [submission, setSubmission] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [publishData, setPublishData] = useState({
    english_name: "",
    scientific_name: "",
    description: "",
    venom_status: "UNKNOWN",
    danger_level: "UNKNOWN",
    minimum_size_cm: "",
    maximum_size_cm: "",
    behavior: "",
    what_to_do: "",
    what_not_to_do: "",
  });

  useEffect(() => {
    let requestCancelled = false;

    async function loadSubmission() {
      if (!token || !isContentAdmin) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/content/submissions/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!requestCancelled) {
          const loadedSubmission = response.data?.data?.submission || null;

          setSubmission(loadedSubmission);
          setReviewNotes(loadedSubmission?.review_notes || "");
          setPublishData({
            english_name: "",
            scientific_name: "",
            description: "",
            venom_status: loadedSubmission?.venom_status || "UNKNOWN",
            danger_level: "UNKNOWN",
            minimum_size_cm: loadedSubmission?.minimum_size_cm || "",
            maximum_size_cm: loadedSubmission?.maximum_size_cm || "",
            behavior: loadedSubmission?.behavior_notes || "",
            what_to_do: "",
            what_not_to_do: "",
          });
        }
      } catch (requestError) {
        console.error("Failed to load content submission:", requestError);

        if (!requestCancelled) {
          setError(
            requestError.response?.data?.message ||
              "تعذر تحميل تفاصيل الاقتراح.",
          );
        }
      } finally {
        if (!requestCancelled) {
          setLoading(false);
        }
      }
    }

    loadSubmission();

    return () => {
      requestCancelled = true;
    };
  }, [id, token, isContentAdmin]);

  async function updateStatus(status) {
    if (!submission || updatingStatus) {
      return;
    }

    if (status === "REJECTED" && !reviewNotes.trim()) {
      setError("يجب كتابة سبب الرفض أو ملاحظات المراجعة.");
      return;
    }

    setUpdatingStatus(status);
    setError("");
    setSuccess("");

    try {
      const response = await axios.patch(
        `${API_URL}/content/submissions/${submission.id}/status`,
        {
          status,
          review_notes: reviewNotes.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedSubmission = response.data?.data?.submission;

      setSubmission((currentSubmission) => ({
        ...currentSubmission,
        ...updatedSubmission,
      }));

      if (status === "UNDER_REVIEW") {
        setSuccess("تم تحويل الاقتراح إلى قيد المراجعة.");
      }

      if (status === "APPROVED") {
        setSuccess("تم قبول الاقتراح بنجاح.");
      }

      if (status === "REJECTED") {
        setSuccess("تم رفض الاقتراح وتسجيل الملاحظات.");
      }
    } catch (requestError) {
      console.error("Failed to update submission status:", requestError);

      setError(
        requestError.response?.data?.message || "تعذر تحديث حالة الاقتراح.",
      );
    } finally {
      setUpdatingStatus("");
    }
  }

  function handlePublishChange(event) {
    const { name, value } = event.target;

    setPublishData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function publishSubmission(event) {
    event.preventDefault();

    if (publishing || !submission) {
      return;
    }

    const requiredFields = [
      "english_name",
      "scientific_name",
      "description",
      "behavior",
      "what_to_do",
      "what_not_to_do",
    ];

    const hasMissingField = requiredFields.some(
      (field) => !publishData[field].trim(),
    );

    if (hasMissingField) {
      setError("يجب تعبئة جميع الحقول المطلوبة قبل النشر.");
      return;
    }

    const minimumSize = publishData.minimum_size_cm
      ? Number(publishData.minimum_size_cm)
      : null;

    const maximumSize = publishData.maximum_size_cm
      ? Number(publishData.maximum_size_cm)
      : null;

    if (
      minimumSize !== null &&
      maximumSize !== null &&
      maximumSize < minimumSize
    ) {
      setError("يجب أن يكون الحد الأقصى للطول أكبر من أو يساوي الحد الأدنى.");
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${API_URL}/content/submissions/${submission.id}/publish`,
        {
          english_name: publishData.english_name.trim(),
          scientific_name: publishData.scientific_name.trim(),
          description: publishData.description.trim(),
          venom_status: publishData.venom_status,
          danger_level: publishData.danger_level,
          minimum_size_cm: publishData.minimum_size_cm || null,
          maximum_size_cm: publishData.maximum_size_cm || null,
          behavior: publishData.behavior.trim(),
          what_to_do: publishData.what_to_do.trim(),
          what_not_to_do: publishData.what_not_to_do.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const publishedSpecies = response.data?.data?.species;
      const updatedSubmission = response.data?.data?.submission;

      setSubmission((current) => ({
        ...current,
        ...updatedSubmission,
      }));

      setSuccess("تم نشر الأفعى بنجاح وإضافتها إلى دليل الأفاعي.");

      if (publishedSpecies?.id) {
        setTimeout(() => {
          navigate(`/species/${publishedSpecies.id}`);
        }, 1400);
      }
    } catch (requestError) {
      console.error("Failed to publish submission:", requestError);

      const errorCode = requestError.response?.data?.code;

      if (errorCode === "SCIENTIFIC_NAME_ALREADY_EXISTS") {
        setError("يوجد نوع منشور بالفعل يحمل الاسم العلمي نفسه.");
      } else {
        setError(requestError.response?.data?.message || "تعذر نشر النوع.");
      }
    } finally {
      setPublishing(false);
    }
  }

  if (!token || !user) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

          <h1>تسجيل الدخول مطلوب</h1>

          <p>يجب تسجيل الدخول بحساب مدير محتوى للوصول إلى هذه الصفحة.</p>

          <Link className="button button--primary" to="/login">
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  if (!isContentAdmin) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

          <h1>غير مصرح لك بالدخول</h1>

          <p>هذه الصفحة مخصصة لمدير المحتوى أو مدير النظام.</p>

          <Link className="button button--primary" to="/">
            العودة إلى الرئيسية
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="content-review-page">
        <div className="content-review-loading">
          <LoaderCircle className="spinning-icon" size={42} />

          <p>جاري تحميل الاقتراح...</p>
        </div>
      </main>
    );
  }

  if (error && !submission) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <AlertTriangle size={45} />

          <h1>تعذر فتح الاقتراح</h1>

          <p>{error}</p>

          <Link className="button button--primary" to="/content/submissions">
            <ArrowRight size={18} />
            العودة إلى الاقتراحات
          </Link>
        </div>
      </main>
    );
  }

  if (!submission) {
    return null;
  }

  const statusInfo = getStatusInfo(submission.status);

  const StatusIcon = statusInfo.icon;

  const images = Array.isArray(submission.images) ? submission.images : [];

  const selectedImage = images[selectedImageIndex];

  const submitter = submission.submitted_by_user;

  const reviewer = submission.reviewed_by_user;

  const sizeLabel =
    submission.minimum_size_cm && submission.maximum_size_cm
      ? `${submission.minimum_size_cm} - ${submission.maximum_size_cm} سم`
      : submission.minimum_size_cm
        ? `من ${submission.minimum_size_cm} سم`
        : submission.maximum_size_cm
          ? `حتى ${submission.maximum_size_cm} سم`
          : "غير محدد";

  const hasFinalDecision = ["APPROVED", "REJECTED", "PUBLISHED"].includes(
    submission.status,
  );

  return (
    <main className="content-review-page">
      <section className="content-review-hero">
        <div className="page-container">
          <Link className="submission-back-link" to="/content/submissions">
            <ArrowRight size={18} />
            العودة إلى قائمة الاقتراحات
          </Link>

          <div className="content-review-title">
            <div>
              <span className="eyebrow">
                <FileSearch size={18} />
                مراجعة الاقتراح رقم #{submission.id}
              </span>

              <h1>{submission.arabic_name}</h1>

              <p>أُرسل بتاريخ {formatDate(submission.created_at)}</p>
            </div>

            <span
              className={`expert-status-badge content-review-status ${statusInfo.className}`}
            >
              <StatusIcon size={17} />
              {statusInfo.label}
            </span>
          </div>
        </div>
      </section>

      <section className="page-container content-review-layout">
        <div className="content-review-main">
          <section className="content-review-images">
            <div className="content-review-main-image">
              {selectedImage ? (
                <img
                  className="content-review-real-image"
                  src={`${BACKEND_URL}/uploads/${selectedImage.media_asset?.storage_key}`}
                  alt={submission.arabic_name}
                />
              ) : (
                <div className="submission-image-placeholder">
                  <ImageIcon size={60} />
                  <strong>لا توجد صور</strong>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="submission-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={selectedImageIndex === index ? "is-active" : ""}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={`${BACKEND_URL}/uploads/${selectedImage.media_asset?.storage_key}`}
                      alt={`${submission.arabic_name} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="content-review-information">
            <h2>بيانات الاقتراح</h2>

            <div className="submission-info-grid">
              <article>
                <Skull size={22} />

                <div>
                  <span>حالة السمّية</span>

                  <strong>{getVenomLabel(submission.venom_status)}</strong>
                </div>
              </article>

              <article>
                <Ruler size={22} />

                <div>
                  <span>الطول التقريبي</span>
                  <strong>{sizeLabel}</strong>
                </div>
              </article>

              <article className="submission-info-full">
                <MapPin size={22} />

                <div>
                  <span>الموطن أو منطقة الانتشار</span>

                  <strong>
                    {submission.habitat_notes || "لم تتم إضافة معلومات"}
                  </strong>
                </div>
              </article>
            </div>

            <article className="submission-text-section">
              <h3>السلوك العام</h3>

              <p>
                {submission.behavior_notes ||
                  "لم يضف الخبير معلومات عن السلوك."}
              </p>
            </article>

            <article className="submission-text-section">
              <h3>ملاحظات الخبير</h3>

              <p>{submission.expert_notes || "لا توجد ملاحظات إضافية."}</p>
            </article>
          </section>
        </div>

        <aside className="content-review-sidebar">
          <section className="content-review-person">
            <UserRound size={25} />

            <div>
              <span>أرسل بواسطة</span>

              <strong>
                {submitter?.username || submitter?.email || "مستخدم غير معروف"}
              </strong>

              <small>{submitter?.email || ""}</small>
            </div>
          </section>

          {reviewer && (
            <section className="content-review-person">
              <ShieldCheck size={25} />

              <div>
                <span>تمت المراجعة بواسطة</span>

                <strong>{reviewer.username || reviewer.email}</strong>

                <small>{formatDate(submission.reviewed_at)}</small>
              </div>
            </section>
          )}

          <label className="content-review-notes">
            <span>ملاحظات المراجعة</span>

            <textarea
              rows="7"
              value={reviewNotes}
              maxLength="2000"
              placeholder="اكتب ملاحظات القبول أو سبب الرفض..."
              disabled={updatingStatus || hasFinalDecision}
              onChange={(event) => {
                setReviewNotes(event.target.value);

                if (error) {
                  setError("");
                }
              }}
            />

            <small>{reviewNotes.length}/2000</small>
          </label>

          {error && (
            <div className="expert-form-message expert-form-message--error">
              <AlertTriangle size={21} />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="expert-form-message expert-form-message--success">
              <CheckCircle2 size={22} />
              <p>{success}</p>
            </div>
          )}

          {!hasFinalDecision ? (
            <div className="content-review-actions">
              {submission.status === "SUBMITTED" && (
                <button
                  type="button"
                  className="content-review-action content-review-action--review"
                  disabled={Boolean(updatingStatus)}
                  onClick={() => updateStatus("UNDER_REVIEW")}
                >
                  {updatingStatus === "UNDER_REVIEW" ? (
                    <LoaderCircle className="spinning-icon" size={19} />
                  ) : (
                    <FileSearch size={19} />
                  )}
                  بدء المراجعة
                </button>
              )}

              <button
                type="button"
                className="content-review-action content-review-action--approve"
                disabled={Boolean(updatingStatus)}
                onClick={() => updateStatus("APPROVED")}
              >
                {updatingStatus === "APPROVED" ? (
                  <LoaderCircle className="spinning-icon" size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
                قبول الاقتراح
              </button>

              <button
                type="button"
                className="content-review-action content-review-action--reject"
                disabled={Boolean(updatingStatus)}
                onClick={() => updateStatus("REJECTED")}
              >
                {updatingStatus === "REJECTED" ? (
                  <LoaderCircle className="spinning-icon" size={19} />
                ) : (
                  <XCircle size={19} />
                )}
                رفض الاقتراح
              </button>
            </div>
          ) : (
            <div className={`content-final-decision ${statusInfo.className}`}>
              <StatusIcon size={25} />

              <div>
                <strong>تم اتخاذ القرار النهائي</strong>

                <p>حالة الاقتراح الحالية: {statusInfo.label}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="content-review-return"
            onClick={() => navigate("/content/submissions")}
          >
            العودة إلى جميع الاقتراحات
          </button>
        </aside>
      </section>

      {submission.status === "APPROVED" && (
        <section className="page-container publish-species-section">
          <div className="publish-species-heading">
            <div className="publish-species-heading__icon">
              <Rocket size={30} />
            </div>

            <div>
              <span>المرحلة الأخيرة</span>
              <h2>استكمال البيانات ونشر النوع</h2>
              <p>
                أكمل المعلومات الرسمية، ثم انشر الأفعى لتظهر في الصفحة الرئيسية
                ودليل الأفاعي.
              </p>
            </div>
          </div>

          <form className="publish-species-form" onSubmit={publishSubmission}>
            <div className="publish-species-grid">
              <label className="expert-field">
                <span>
                  الاسم الإنجليزي
                  <strong>*</strong>
                </span>

                <input
                  type="text"
                  name="english_name"
                  value={publishData.english_name}
                  placeholder="Palestine Viper"
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field">
                <span>
                  الاسم العلمي
                  <strong>*</strong>
                </span>

                <input
                  type="text"
                  name="scientific_name"
                  value={publishData.scientific_name}
                  placeholder="Daboia palaestinae"
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field">
                <span>حالة السمّية</span>

                <select
                  name="venom_status"
                  value={publishData.venom_status}
                  disabled={publishing}
                  onChange={handlePublishChange}
                >
                  <option value="UNKNOWN">غير معروفة</option>
                  <option value="VENOMOUS">سامة</option>
                  <option value="MILDLY_VENOMOUS">سامة بدرجة خفيفة</option>
                  <option value="NON_VENOMOUS">غير سامة</option>
                </select>
              </label>

              <label className="expert-field">
                <span>مستوى الخطورة</span>

                <select
                  name="danger_level"
                  value={publishData.danger_level}
                  disabled={publishing}
                  onChange={handlePublishChange}
                >
                  <option value="UNKNOWN">غير معروف</option>
                  <option value="LOW">منخفض</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">مرتفع</option>
                  <option value="CRITICAL">شديد الخطورة</option>
                </select>
              </label>

              <label className="expert-field">
                <span>الحد الأدنى للطول — سم</span>

                <input
                  type="number"
                  name="minimum_size_cm"
                  min="1"
                  step="0.1"
                  value={publishData.minimum_size_cm}
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field">
                <span>الحد الأقصى للطول — سم</span>

                <input
                  type="number"
                  name="maximum_size_cm"
                  min="1"
                  step="0.1"
                  value={publishData.maximum_size_cm}
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field expert-field--full">
                <span>
                  الوصف
                  <strong>*</strong>
                </span>

                <textarea
                  name="description"
                  rows="5"
                  value={publishData.description}
                  placeholder="اكتب وصفًا شاملًا للنوع ومظهره وخصائصه..."
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field expert-field--full">
                <span>
                  السلوك
                  <strong>*</strong>
                </span>

                <textarea
                  name="behavior"
                  rows="4"
                  value={publishData.behavior}
                  placeholder="صف السلوك والنشاط وطريقة الدفاع..."
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field expert-field--full">
                <span>
                  ماذا يجب أن يفعل المستخدم؟
                  <strong>*</strong>
                </span>

                <textarea
                  name="what_to_do"
                  rows="4"
                  value={publishData.what_to_do}
                  placeholder="ابتعد بهدوء وحافظ على مسافة آمنة..."
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>

              <label className="expert-field expert-field--full">
                <span>
                  ماذا يجب ألّا يفعل المستخدم؟
                  <strong>*</strong>
                </span>

                <textarea
                  name="what_not_to_do"
                  rows="4"
                  value={publishData.what_not_to_do}
                  placeholder="لا تقترب ولا تحاول الإمساك بها..."
                  disabled={publishing}
                  onChange={handlePublishChange}
                />
              </label>
            </div>

            <div className="publish-species-warning">
              <AlertTriangle size={22} />
              <p>
                بعد النشر سيظهر النوع للعامة في دليل الأفاعي. تأكد من صحة الاسم
                العلمي وجميع تعليمات السلامة.
              </p>
            </div>

            <button
              type="submit"
              className="button button--primary publish-species-button"
              disabled={publishing}
            >
              {publishing ? (
                <>
                  <LoaderCircle className="spinning-icon" size={20} />
                  جاري نشر النوع...
                </>
              ) : (
                <>
                  <Rocket size={20} />
                  نشر الأفعى في الدليل
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {submission.status === "PUBLISHED" && (
        <section className="page-container published-species-message">
          <CheckCircle2 size={32} />

          <div>
            <h2>تم نشر هذا الاقتراح</h2>
            <p>أصبح النوع متاحًا في دليل الأفاعي العام.</p>

            {submission.created_species_id && (
              <Link
                className="button button--primary"
                to={`/species/${submission.created_species_id}`}
              >
                <BookOpen size={19} />
                فتح صفحة النوع المنشور
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default ContentSubmissionReviewPage;
