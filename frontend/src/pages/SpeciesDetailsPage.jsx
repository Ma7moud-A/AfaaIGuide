import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MapPin,
  Maximize2,
  Ruler,
  ShieldAlert,
  Skull,
  XCircle,
} from "lucide-react";

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
        label: "متوسطة الخطورة",
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

function getVenomLabel(venomStatus) {
  switch (venomStatus) {
    case "VENOMOUS":
      return "سامة";

    case "MILDLY_VENOMOUS":
      return "سامة بدرجة خفيفة";

    case "NON_VENOMOUS":
      return "غير سامة";

    default:
      return "حالة السمّية غير معروفة";
  }
}

function getMediaStorageKey(media) {
  return (
    media?.storage_key ||
    media?.storageKey ||
    media?.media_asset?.storage_key ||
    media?.mediaAsset?.storage_key ||
    null
  );
}

function getSpeciesImages(snake) {
  const images = Array.isArray(snake?.images)
    ? snake.images
    : [];

  return images
    .map((image) => {
      const storageKey =
        getMediaStorageKey(image);

      if (!storageKey) {
        return null;
      }

      return {
        ...image,
        url: `http://localhost:3000/uploads/${storageKey}`,
      };
    })
    .filter(Boolean);
}

function getPrimarySpeciesImage(snake) {
  const directImage =
    snake?.primary_image ||
    snake?.primaryImage ||
    snake?.image ||
    null;

  const directStorageKey =
    getMediaStorageKey(directImage);

  if (directStorageKey) {
    return `http://localhost:3000/uploads/${directStorageKey}`;
  }

  const images = getSpeciesImages(snake);

  const primary =
    images.find(
      (image) =>
        image?.is_primary || image?.isPrimary
    ) || images[0];

  return primary?.url || "";
}

function SpeciesDetailsPage() {
  const { id } = useParams();

  const [snake, setSnake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);
  const [imageExpanded, setImageExpanded] =
    useState(false);

  useEffect(() => {
    let requestCancelled = false;

    async function loadSpeciesDetails() {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/species/${id}`
        );

        if (!requestCancelled) {
          setSnake(response.data?.data || null);
        }
      } catch (requestError) {
        console.error(
          "Failed to load species details:",
          requestError
        );

        if (!requestCancelled) {
          if (
            requestError.response?.status === 404
          ) {
            setError(
              "لم يتم العثور على هذه الأفعى"
            );
          } else {
            setError(
              "تعذر تحميل تفاصيل الأفعى"
            );
          }
        }
      } finally {
        if (!requestCancelled) {
          setLoading(false);
        }
      }
    }

    loadSpeciesDetails();

    return () => {
      requestCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="species-details-page">
        <section className="page-container details-loading">
          <div className="details-loading__image skeleton" />

          <div className="details-loading__content">
            <div className="skeleton skeleton--details-title" />
            <div className="skeleton skeleton--details-text" />
            <div className="skeleton skeleton--details-text" />
            <div className="skeleton skeleton--details-box" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !snake) {
    return (
      <main className="species-details-page">
        <section className="page-container species-details-state">
          <ShieldAlert size={48} />

          <h1>
            {error ||
              "تعذر العثور على البيانات"}
          </h1>

          <Link
            className="button button--primary"
            to="/species"
          >
            <ArrowRight size={18} />
            العودة إلى دليل الأفاعي
          </Link>
        </section>
      </main>
    );
  }

  const dangerInfo = getDangerInfo(
    snake.danger_level
  );

  const sizeText =
    snake.minimum_size_cm &&
    snake.maximum_size_cm
      ? `${snake.minimum_size_cm} – ${snake.maximum_size_cm} سم`
      : snake.minimum_size_cm
        ? `من ${snake.minimum_size_cm} سم`
        : snake.maximum_size_cm
          ? `حتى ${snake.maximum_size_cm} سم`
          : "غير متوفر";

  const speciesImages =
    getSpeciesImages(snake);

  const primaryImage =
    getPrimarySpeciesImage(snake);

  const selectedImageUrl =
    speciesImages[selectedImageIndex]?.url ||
    primaryImage;

  return (
    <main className="species-details-page">
      <section className="species-details-hero">
        <div className="page-container">
          <nav className="details-breadcrumb">
            <Link to="/">الرئيسية</Link>
            <span>/</span>
            <Link to="/species">
              دليل الأفاعي
            </Link>
            <span>/</span>
            <strong>
              {snake.arabic_name}
            </strong>
          </nav>

          <div className="species-details-layout">
            <div className="species-details-image reveal">
              {selectedImageUrl ? (
                <img
                  className="species-details-real-image"
                  src={selectedImageUrl}
                  alt={snake.arabic_name}
                />
              ) : (
                <div className="species-details-image__placeholder">
                  <span>🐍</span>
                </div>
              )}

              {selectedImageUrl && (
                <button
                  type="button"
                  className="image-expand-button"
                  aria-label="تكبير الصورة"
                  onClick={() =>
                    setImageExpanded(true)
                  }
                >
                  <Maximize2 size={20} />
                </button>
              )}
            </div>

            {speciesImages.length > 1 && (
              <div className="species-details-thumbnails">
                {speciesImages.map(
                  (image, index) => (
                    <button
                      key={
                        image.id ||
                        `${image.url}-${index}`
                      }
                      type="button"
                      className={
                        selectedImageIndex ===
                        index
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        setSelectedImageIndex(
                          index
                        )
                      }
                    >
                      <img
                        src={image.url}
                        alt={`${snake.arabic_name} ${
                          index + 1
                        }`}
                      />
                    </button>
                  )
                )}
              </div>
            )}

            <div className="species-details-summary reveal">
              <span className="eyebrow">
                <BookOpen size={18} />
                معلومات النوع
              </span>

              <h1>{snake.arabic_name}</h1>

              <p className="species-details-summary__english">
                {snake.english_name}
              </p>

              <p className="species-details-summary__scientific">
                {snake.scientific_name}
              </p>

              <div className="species-details-badges">
                <span
                  className={`danger-badge ${dangerInfo.className}`}
                >
                  {dangerInfo.label}
                </span>

                <span className="venom-badge">
                  {getVenomLabel(
                    snake.venom_status
                  )}
                </span>
              </div>

              <div className="species-details-meta">
                <div>
                  <Ruler size={20} />

                  <span>
                    <small>
                      الطول التقريبي
                    </small>

                    <strong>
                      {sizeText}
                    </strong>
                  </span>
                </div>

                <div>
                  <MapPin size={20} />

                  <span>
                    <small>التصنيف</small>

                    <strong>
                      أفاعي فلسطين
                    </strong>
                  </span>
                </div>

                <div>
                  <Skull size={20} />

                  <span>
                    <small>
                      مستوى الخطورة
                    </small>

                    <strong>
                      {dangerInfo.label}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container species-details-content">
        <article className="details-section-card reveal">
          <span className="section-heading__label">
            معلومات عامة
          </span>

          <h2>الوصف</h2>

          <p>
            {snake.description ||
              "لا يوجد وصف متوفر لهذا النوع حاليًا."}
          </p>
        </article>

        <div className="details-information-grid">
          <article className="details-section-card reveal">
            <span className="section-heading__label">
              <AlertTriangle size={17} />
              السلوك
            </span>

            <h2>السلوك المعتاد</h2>

            <p>
              {snake.behavior ||
                "لا توجد معلومات سلوكية متوفرة حاليًا."}
            </p>
          </article>

          <article className="details-section-card details-section-card--danger reveal">
            <span className="section-heading__label">
              <ShieldAlert size={17} />
              تنبيه السلامة
            </span>

            <h2>التعامل الآمن</h2>

            <p>
              لا تقترب من الأفعى، ولا تحاول
              لمسها أو نقلها، وتعامل معها
              باعتبارها خطرة حتى يتأكد نوعها.
            </p>
          </article>
        </div>

        <div className="safety-comparison">
          <article className="safety-action-card safety-action-card--do reveal">
            <div className="safety-action-card__heading">
              <CheckCircle2 size={24} />
              <h2>ماذا تفعل؟</h2>
            </div>

            <p>
              {snake.what_to_do ||
                "ابتعد بهدوء، وحافظ على مسافة آمنة، واتصل بخبير مختص عند الحاجة."}
            </p>
          </article>

          <article className="safety-action-card safety-action-card--dont reveal">
            <div className="safety-action-card__heading">
              <XCircle size={24} />
              <h2>ماذا لا تفعل؟</h2>
            </div>

            <p>
              {snake.what_not_to_do ||
                "لا تحاول الإمساك بالأفعى أو قتلها أو استفزازها."}
            </p>
          </article>
        </div>

        <div className="details-back-link">
          <Link
            className="button button--secondary"
            to="/species"
          >
            <ArrowRight size={18} />
            العودة إلى دليل الأفاعي
          </Link>
        </div>
      </section>

      {imageExpanded && selectedImageUrl && (
        <div
          className="species-image-modal"
          onClick={() =>
            setImageExpanded(false)
          }
        >
          <button
            type="button"
            className="species-image-modal__close"
            onClick={() =>
              setImageExpanded(false)
            }
          >
            ×
          </button>

          <img
            src={selectedImageUrl}
            alt={snake.arabic_name}
            onClick={(event) =>
              event.stopPropagation()
            }
          />
        </div>
      )}
    </main>
  );
}

export default SpeciesDetailsPage;