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
  ShieldCheck,
  UserRound,
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
  }).format(date);
}

function ContentSubmissionsPage() {
  const user = getStoredUser();
  const token = localStorage.getItem("afaai_token");

  const isContentAdmin = useMemo(() => {
    return user?.roles?.some((role) =>
      ["CONTENT_ADMIN", "ADMIN"].includes(role),
    );
  }, [user]);

  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let requestCancelled = false;

    async function loadSubmissions() {
      if (!token || !isContentAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;

        const response = await axios.get(
          `${API_URL}/content/submissions${query}`,
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
        console.error("Failed to load content submissions:", requestError);

        if (!requestCancelled) {
          setError(
            requestError.response?.data?.message ||
              "تعذر تحميل اقتراحات الخبراء.",
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
  }, [token, isContentAdmin, statusFilter]);

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

  return (
    <main className="content-submissions-page">
      <section className="content-page-hero">
        <div className="page-container content-page-hero__content">
          <div>
            <span className="eyebrow">
              <ShieldCheck size={18} />
              لوحة مدير المحتوى
            </span>

            <h1>مراجعة اقتراحات الخبراء</h1>

            <p>
              راجع البيانات والصور، ثم اقبل الاقتراح أو ارفضه مع إضافة ملاحظات
              واضحة.
            </p>
          </div>

          <div className="content-page-hero__icon">
            <FileSearch size={43} />
          </div>
        </div>
      </section>

      <section className="page-container content-submissions-content">
        <div className="content-submissions-toolbar">
          <div>
            <h2>الاقتراحات</h2>

            <p>
              عدد النتائج الحالية: <strong>{submissions.length}</strong>
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">جميع الحالات</option>

            <option value="SUBMITTED">بانتظار المراجعة</option>

            <option value="UNDER_REVIEW">قيد المراجعة</option>

            <option value="APPROVED">مقبولة</option>

            <option value="REJECTED">مرفوضة</option>
          </select>
        </div>

        {loading && (
          <div className="content-submissions-state">
            <LoaderCircle className="spinning-icon" size={38} />

            <p>جاري تحميل الاقتراحات...</p>
          </div>
        )}

        {!loading && error && (
          <div className="content-submissions-state content-submissions-state--error">
            <AlertTriangle size={37} />

            <h2>تعذر تحميل الاقتراحات</h2>

            <p>{error}</p>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="content-submissions-state">
            <FileSearch size={40} />

            <h2>لا توجد اقتراحات</h2>

            <p>لا توجد اقتراحات مطابقة للحالة المختارة.</p>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="content-submissions-grid">
            {submissions.map((submission) => {
              const statusInfo = getStatusInfo(submission.status);

              const StatusIcon = statusInfo.icon;

              const primaryImage =
                submission.images?.find((image) => image.is_primary) ||
                submission.images?.[0];

              const submitter = submission.submitted_by_user;

              return (
                <article
                  key={submission.id}
                  className="content-submission-card"
                >
                  <div className="content-submission-card__image">
                    <div className="content-submission-card__placeholder">
                      <ImageIcon size={42} />

                      <span>
                        {primaryImage?.media_asset?.original_filename ||
                          "لا توجد صورة"}
                      </span>
                    </div>

                    <span
                      className={`expert-status-badge ${statusInfo.className}`}
                    >
                      <StatusIcon size={15} />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="content-submission-card__body">
                    <div className="content-submission-card__heading">
                      <div>
                        <h2>{submission.arabic_name}</h2>

                        <p>اقتراح رقم #{submission.id}</p>
                      </div>

                      <span>{submission.images?.length || 0} صور</span>
                    </div>

                    <div className="content-submission-card__submitter">
                      <UserRound size={18} />

                      <div>
                        <span>أرسل بواسطة</span>

                        <strong>
                          {submitter?.username ||
                            submitter?.email ||
                            "مستخدم غير معروف"}
                        </strong>
                      </div>
                    </div>

                    <div className="content-submission-card__meta">
                      <div>
                        <span>السمّية</span>

                        <strong>
                          {getVenomLabel(submission.venom_status)}
                        </strong>
                      </div>

                      <div>
                        <span>تاريخ الإرسال</span>

                        <strong>{formatDate(submission.created_at)}</strong>
                      </div>
                    </div>

                    <Link
                      className="content-submission-card__button"
                      to={`/content/submissions/${submission.id}`}
                    >
                      <Eye size={18} />
                      فتح الاقتراح ومراجعته
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

export default ContentSubmissionsPage;
