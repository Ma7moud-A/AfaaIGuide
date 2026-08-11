import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Ruler,
  ShieldCheck,
  Skull,
  XCircle,
} from "lucide-react";

import { API_URL } from "../config/api";

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

    case "REJECTED":
      return {
        label: "مرفوض",
        className: "rejected",
        icon: XCircle,
      };

    case "PUBLISHED":
      return {
        label: "منشور",
        className: "published",
        icon: ShieldCheck,
      };

    case "UNDER_REVIEW":
      return {
        label: "قيد المراجعة",
        className: "review",
        icon: FileSearch,
      };

    case "SUBMITTED":
    case "PENDING":
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

function ExpertSubmissionDetailsPage() {
  const { id } = useParams();

  const user = getStoredUser();
  const token = localStorage.getItem("afaai_token");

  const isExpert = useMemo(() => {
    return user?.roles?.some((role) =>
      ["EXPERT", "ADMIN"].includes(role)
    );
  }, [user]);

  const [submission, setSubmission] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let requestCancelled = false;

    async function loadSubmission() {
      if (!token || !isExpert) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/expert/species-submissions/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!requestCancelled) {
          setSubmission(
            response.data?.data?.submission || null
          );
        }
      } catch (requestError) {
        console.error(
          "Failed to load submission:",
          requestError
        );

        if (!requestCancelled) {
          setError(
            requestError.response?.data?.message ||
              "تعذر تحميل تفاصيل الاقتراح."
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
  }, [id, token, isExpert]);

  if (!token || !user) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

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
            حسابك الحالي لا يمتلك صلاحية مشاهدة هذا
            الاقتراح.
          </p>

          <Link
            className="button button--primary"
            to="/"
          >
            العودة إلى الرئيسية
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="submission-details-page">
        <div className="submission-details-loading">
          <LoaderCircle
            className="spinning-icon"
            size={42}
          />

          <p>جاري تحميل تفاصيل الاقتراح...</p>
        </div>
      </main>
    );
  }

  if (error || !submission) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <AlertTriangle size={45} />

          <h1>تعذر فتح الاقتراح</h1>

          <p>{error || "الاقتراح غير موجود."}</p>

          <Link
            className="button button--primary"
            to="/expert/submissions"
          >
            <ArrowRight size={18} />
            العودة إلى اقتراحاتي
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = getStatusInfo(submission.status);
  const StatusIcon = statusInfo.icon;

  const images = Array.isArray(submission.images)
    ? submission.images
    : [];

  const selectedImage = images[selectedImageIndex];

  const sizeLabel =
    submission.minimum_size_cm &&
    submission.maximum_size_cm
      ? `${submission.minimum_size_cm} - ${submission.maximum_size_cm} سم`
      : submission.minimum_size_cm
        ? `من ${submission.minimum_size_cm} سم`
        : submission.maximum_size_cm
          ? `حتى ${submission.maximum_size_cm} سم`
          : "غير محدد";

  return (
    <main className="submission-details-page">
      <section className="submission-details-hero">
        <div className="page-container">
          <Link
            className="submission-back-link"
            to="/expert/submissions"
          >
            <ArrowRight size={18} />
            العودة إلى اقتراحاتي
          </Link>

          <div className="submission-details-title">
            <div>
              <span className="eyebrow">
                <ShieldCheck size={18} />
                اقتراح رقم #{submission.id}
              </span>

              <h1>{submission.arabic_name}</h1>

              <p>
                تم إرسال الاقتراح بتاريخ{" "}
                {formatDate(submission.created_at)}
              </p>
            </div>

            <span
              className={`expert-status-badge submission-status ${statusInfo.className}`}
            >
              <StatusIcon size={17} />
              {statusInfo.label}
            </span>
          </div>
        </div>
      </section>

      <section className="page-container submission-details-content">
        <div className="submission-images-panel">
          <div className="submission-main-image">
            {selectedImage ? (
              <div className="submission-image-placeholder">
                <ImageIcon size={60} />

                <strong>
                  {selectedImage.media_asset
                    ?.original_filename ||
                    "صورة الاقتراح"}
                </strong>

                <span>
                  {selectedImage.media_asset?.width || "?"}
                  {" × "}
                  {selectedImage.media_asset?.height || "?"}
                </span>
              </div>
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
                  className={
                    selectedImageIndex === index
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedImageIndex(index)
                  }
                >
                  <ImageIcon size={23} />

                  <span>{index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="submission-information-panel">
          <h2>معلومات الاقتراح</h2>

          <div className="submission-info-grid">
            <article>
              <Skull size={22} />

              <div>
                <span>حالة السمّية</span>
                <strong>
                  {getVenomLabel(
                    submission.venom_status
                  )}
                </strong>
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
                  {submission.habitat_notes ||
                    "لم تتم إضافة معلومات"}
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

            <p>
              {submission.expert_notes ||
                "لا توجد ملاحظات إضافية."}
            </p>
          </article>

          <div className="submission-review-notice">
            <Clock3 size={23} />

            <div>
              <strong>حالة المراجعة</strong>

              <p>
                الاقتراح محفوظ ولم يظهر بعد في دليل
                الأفاعي العام. سيقوم مدير المحتوى بمراجعته
                واستكمال بياناته قبل النشر.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ExpertSubmissionDetailsPage;