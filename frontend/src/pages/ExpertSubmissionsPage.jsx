import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileSearch,
  ImageIcon,
  LoaderCircle,
  PlusCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

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
  }).format(date);
}

function ExpertSubmissionsPage() {
  const user = getStoredUser();
  const token = localStorage.getItem("afaai_token");

  const isExpert = useMemo(() => {
    return user?.roles?.some((role) => ["EXPERT", "ADMIN"].includes(role));
  }, [user]);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let requestCancelled = false;

    async function loadSubmissions() {
      if (!token || !isExpert) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/expert/species-submissions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!requestCancelled) {
          setSubmissions(
            Array.isArray(response.data?.data?.submissions)
              ? response.data.data.submissions
              : [],
          );
        }
      } catch (requestError) {
        console.error("Failed to load expert submissions:", requestError);

        if (!requestCancelled) {
          setError(
            requestError.response?.data?.message || "تعذر تحميل الاقتراحات.",
          );
        }
      } finally {
        if (!requestCancelled) {
          setLoading(false);
        }
      }
    }

    loadSubmissions();

    return () => {
      requestCancelled = true;
    };
  }, [token, isExpert]);

  const pendingCount = submissions.filter((submission) =>
    ["SUBMITTED", "PENDING", "UNDER_REVIEW"].includes(submission.status),
  ).length;

  const approvedCount = submissions.filter((submission) =>
    ["APPROVED", "PUBLISHED"].includes(submission.status),
  ).length;

  if (!token || !user) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

          <h1>تسجيل الدخول مطلوب</h1>

          <p>يجب تسجيل الدخول بحساب خبير للوصول إلى هذه الصفحة.</p>

          <Link className="button button--primary" to="/login">
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

          <p>حسابك الحالي لا يمتلك صلاحية عرض اقتراحات الخبراء.</p>

          <Link className="button button--primary" to="/">
            العودة إلى الرئيسية
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="expert-submissions-page">
      <section className="expert-page-hero">
        <div className="page-container expert-page-hero__content">
          <div>
            <span className="eyebrow">
              <ShieldCheck size={18} />
              مساحة الخبراء
            </span>

            <h1>اقتراحاتي</h1>

            <p>تابع جميع اقتراحاتك السابقة وحالة مراجعة كل اقتراح.</p>
          </div>

          <Link className="button button--primary" to="/expert/submissions/new">
            <PlusCircle size={19} />
            اقتراح أفعى جديدة
          </Link>
        </div>
      </section>

      <section className="page-container expert-submissions-content">
        <div className="expert-submissions-summary">
          <div>
            <strong>{submissions.length}</strong>
            <span>إجمالي الاقتراحات</span>
          </div>

          <div>
            <strong>{pendingCount}</strong>
            <span>بانتظار المراجعة</span>
          </div>

          <div>
            <strong>{approvedCount}</strong>
            <span>مقبولة أو منشورة</span>
          </div>
        </div>

        {loading && (
          <div className="expert-submissions-loading">
            <LoaderCircle className="spinning-icon" size={36} />

            <p>جاري تحميل الاقتراحات...</p>
          </div>
        )}

        {!loading && error && (
          <div className="expert-submissions-error">
            <AlertTriangle size={30} />

            <h2>تعذر تحميل الاقتراحات</h2>

            <p>{error}</p>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="expert-submissions-empty">
            <FileSearch size={40} />

            <h2>لا توجد اقتراحات بعد</h2>

            <p>أرسل أول اقتراح أفعى ليظهر هنا.</p>

            <Link
              className="button button--primary"
              to="/expert/submissions/new"
            >
              <PlusCircle size={18} />
              إضافة اقتراح
            </Link>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="expert-submissions-grid">
            {submissions.map((submission) => {
              const statusInfo = getStatusInfo(submission.status);

              const StatusIcon = statusInfo.icon;

              const primaryImage =
                submission.images?.find((image) => image.is_primary) ||
                submission.images?.[0];

              return (
                <article key={submission.id} className="expert-submission-card">
                  <div className="expert-submission-card__image">
                    {primaryImage ? (
                      <div className="expert-submission-card__placeholder">
                        <ImageIcon size={39} />

                        <span>
                          {primaryImage.media_asset?.original_filename ||
                            "صورة الاقتراح"}
                        </span>
                      </div>
                    ) : (
                      <div className="expert-submission-card__placeholder">
                        <ImageIcon size={39} />
                        <span>لا توجد صورة</span>
                      </div>
                    )}

                    <span
                      className={`expert-status-badge ${statusInfo.className}`}
                    >
                      <StatusIcon size={15} />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="expert-submission-card__body">
                    <div className="expert-submission-card__heading">
                      <div>
                        <h2>{submission.arabic_name || "اسم غير متوفر"}</h2>

                        <p>اقتراح رقم #{submission.id}</p>
                      </div>

                      <span>{submission.images?.length || 0} صور</span>
                    </div>

                    <div className="expert-submission-card__meta">
                      <div>
                        <span>حالة السمّية</span>

                        <strong>
                          {getVenomLabel(submission.venom_status)}
                        </strong>
                      </div>

                      <div>
                        <span>تاريخ الإرسال</span>

                        <strong>{formatDate(submission.created_at)}</strong>
                      </div>
                    </div>

                    {submission.expert_notes && (
                      <p className="expert-submission-card__notes">
                        {submission.expert_notes}
                      </p>
                    )}

                    <Link
                      className="expert-submission-card__button"
                      to={`/expert/submissions/${submission.id}`}
                    >
                      <Eye size={17} />
                      عرض التفاصيل
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default ExpertSubmissionsPage;
