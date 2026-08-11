import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Edit3,
  Eye,
  LoaderCircle,
  Search,
  ShieldCheck,
  Skull,
  Trash2,
} from "lucide-react";

import {
  API_URL,
  BACKEND_URL,
} from "../config/api";

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("afaai_user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function getDangerInfo(dangerLevel) {
  switch (dangerLevel) {
    case "CRITICAL":
      return {
        className: "danger",
        label: "شديدة الخطورة",
      };

    case "HIGH":
      return {
        className: "danger",
        label: "خطيرة",
      };

    case "MEDIUM":
      return {
        className: "medium",
        label: "متوسطة",
      };

    case "LOW":
      return {
        className: "safe",
        label: "قليلة الخطورة",
      };

    default:
      return {
        className: "unknown",
        label: "غير معروفة",
      };
  }
}

function getVenomLabel(status) {
  switch (status) {
    case "VENOMOUS":
      return "سامة";

    case "MILDLY_VENOMOUS":
      return "سمّية خفيفة";

    case "NON_VENOMOUS":
      return "غير سامة";

    default:
      return "غير معروفة";
  }
}

function getImageUrl(snake) {
  if (!Array.isArray(snake?.images) || snake.images.length === 0) {
    return "";
  }

  const primaryImage =
    snake.images.find((image) => image.is_primary) ||
    snake.images[0];

  if (!primaryImage?.storage_key) {
    return "";
  }

  return `${BACKEND_URL}/uploads/${primaryImage.storage_key}`;
}

function ContentSpeciesPage() {
  const user = getStoredUser();
  const token = localStorage.getItem("afaai_token");

  const isContentAdmin = useMemo(() => {
    return user?.roles?.some((role) =>
      ["CONTENT_ADMIN", "ADMIN"].includes(role)
    );
  }, [user]);

  const [species, setSpecies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let requestCancelled = false;

    async function loadSpecies() {
      if (!token || !isContentAdmin) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/species`
        );

        if (!requestCancelled) {
          setSpecies(
            Array.isArray(response.data?.data)
              ? response.data.data
              : []
          );
        }
      } catch (requestError) {
        console.error(
          "Failed to load content species:",
          requestError
        );

        if (!requestCancelled) {
          setError("تعذر تحميل الأنواع المنشورة.");
        }
      } finally {
        if (!requestCancelled) {
          setLoading(false);
        }
      }
    }

    loadSpecies();

    return () => {
      requestCancelled = true;
    };
  }, [token, isContentAdmin]);

  const filteredSpecies = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return species;
    }

    return species.filter((snake) => {
      return (
        snake.arabic_name
          ?.toLowerCase()
          .includes(search) ||
        snake.english_name
          ?.toLowerCase()
          .includes(search) ||
        snake.scientific_name
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [species, searchTerm]);

  async function handleDeleteSpecies(snake) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${snake.arabic_name}" بالكامل من الدليل؟\n\nلا يمكن التراجع عن هذه العملية.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(snake.id);

      await axios.delete(
        `${API_URL}/species/${snake.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSpecies((currentSpecies) =>
        currentSpecies.filter(
          (item) => item.id !== snake.id
        )
      );
    } catch (requestError) {
      console.error(
        "Failed to delete species:",
        requestError
      );

      window.alert(
        requestError.response?.data?.message ||
          "تعذر حذف النوع."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!token || !user) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

          <h1>تسجيل الدخول مطلوب</h1>

          <p>
            يجب تسجيل الدخول بحساب مدير محتوى.
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

  if (!isContentAdmin) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck size={45} />

          <h1>غير مصرح لك بالدخول</h1>

          <p>
            هذه الصفحة مخصصة لمدير المحتوى أو مدير النظام.
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

  return (
    <main className="content-species-page">
      <section className="content-species-hero">
        <div className="page-container content-species-hero__content">
          <div>
            <span className="eyebrow">
              <BookOpen size={18} />
              إدارة المحتوى
            </span>

            <h1>إدارة الأنواع المنشورة</h1>

            <p>
              راجع الأنواع المنشورة وعدّل بياناتها عند الحاجة.
            </p>
          </div>

          <div className="content-species-counter">
            <strong>{species.length}</strong>
            <span>نوع منشور</span>
          </div>
        </div>
      </section>

      <section className="page-container content-species-browser">
        <div className="content-species-toolbar">
          <div className="species-search">
            <Search size={20} />

            <input
              type="search"
              value={searchTerm}
              placeholder="ابحث بالاسم العربي أو الإنجليزي أو العلمي..."
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <Link
            className="button button--secondary"
            to="/content/submissions"
          >
            مراجعة اقتراحات الخبراء
            <ArrowLeft size={18} />
          </Link>
        </div>

        {loading && (
          <div className="content-species-loading">
            <LoaderCircle
              className="spinning-icon"
              size={40}
            />

            <p>جاري تحميل الأنواع...</p>
          </div>
        )}

        {!loading && error && (
          <div className="species-state species-state--error">
            <AlertTriangle size={38} />

            <h2>{error}</h2>
          </div>
        )}

        {!loading &&
          !error &&
          filteredSpecies.length === 0 && (
            <div className="species-state">
              <Search size={38} />

              <h2>لا توجد نتائج</h2>

              <p>
                جرّب تغيير كلمة البحث.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredSpecies.length > 0 && (
            <div className="content-species-grid">
              {filteredSpecies.map((snake) => {
                const imageUrl =
                  getImageUrl(snake);

                const dangerInfo =
                  getDangerInfo(
                    snake.danger_level
                  );

                return (
                  <article
                    key={snake.id}
                    className="content-species-card"
                  >
                    <div className="content-species-card__image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={snake.arabic_name}
                        />
                      ) : (
                        <span>🐍</span>
                      )}
                    </div>

                    <div className="content-species-card__body">
                      <div className="content-species-card__heading">
                        <div>
                          <h2>
                            {snake.arabic_name}
                          </h2>

                          <p>
                            {snake.english_name}
                          </p>

                          <small>
                            {snake.scientific_name}
                          </small>
                        </div>

                        <span
                          className={`danger-badge ${dangerInfo.className}`}
                        >
                          {dangerInfo.label}
                        </span>
                      </div>

                      <div className="content-species-meta">
                        <span>
                          <Skull size={17} />

                          {getVenomLabel(
                            snake.venom_status
                          )}
                        </span>

                        <span>
                          ID #{snake.id}
                        </span>
                      </div>

                      <div className="content-species-actions">
                        <Link
                          className="content-species-action"
                          to={`/species/${snake.id}`}
                        >
                          <Eye size={18} />
                          عرض
                        </Link>

                        <Link
                          className="content-species-action content-species-action--edit"
                          to={`/content/species/${snake.id}/edit`}
                        >
                          <Edit3 size={18} />
                          تعديل
                        </Link>

                        <button
                          type="button"
                          className="content-species-action content-species-action--delete"
                          disabled={
                            deletingId === snake.id
                          }
                          onClick={() =>
                            handleDeleteSpecies(
                              snake
                            )
                          }
                        >
                          <Trash2 size={18} />

                          {deletingId === snake.id
                            ? "جاري الحذف..."
                            : "حذف"}
                        </button>
                      </div>
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

export default ContentSpeciesPage;