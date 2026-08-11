import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  BookOpen,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

import { API_URL, getUploadUrl } from "../config/api";

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

function getMediaStorageKey(media) {
  return (
    media?.storage_key ||
    media?.storageKey ||
    media?.media_asset?.storage_key ||
    media?.mediaAsset?.storage_key ||
    null
  );
}

function getSpeciesImageUrl(snake) {
  const directImage =
    snake?.primary_image || snake?.primaryImage || snake?.image || null;

  let storageKey = getMediaStorageKey(directImage);

  if (!storageKey && Array.isArray(snake?.images)) {
    const primaryImage =
      snake.images.find((image) => image?.is_primary || image?.isPrimary) ||
      snake.images[0];

    storageKey = getMediaStorageKey(primaryImage);
  }

  if (!storageKey) {
    return "";
  }

  return getUploadUrl(storageKey);
}

function SpeciesPage() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [dangerFilter, setDangerFilter] = useState("ALL");
  const [venomFilter, setVenomFilter] = useState("ALL");

  useEffect(() => {
    let requestCancelled = false;

    async function loadSpecies() {
      try {
        const response = await axios.get("`${API_URL}/species`");

        if (!requestCancelled) {
          setSpecies(
            Array.isArray(response.data?.data) ? response.data.data : [],
          );
        }
      } catch (requestError) {
        console.error("Failed to load species:", requestError);

        if (!requestCancelled) {
          setError("تعذر تحميل دليل الأفاعي");
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
  }, []);

  const filteredSpecies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return species.filter((snake) => {
      const matchesSearch =
        !normalizedSearch ||
        snake.arabic_name?.toLowerCase().includes(normalizedSearch) ||
        snake.english_name?.toLowerCase().includes(normalizedSearch) ||
        snake.scientific_name?.toLowerCase().includes(normalizedSearch);

      const matchesDanger =
        dangerFilter === "ALL" || snake.danger_level === dangerFilter;

      const matchesVenom =
        venomFilter === "ALL" || snake.venom_status === venomFilter;

      return matchesSearch && matchesDanger && matchesVenom;
    });
  }, [species, searchTerm, dangerFilter, venomFilter]);

  return (
    <main className="species-page">
      <section className="species-page__hero">
        <div className="page-container species-page__hero-content">
          <div className="reveal">
            <span className="eyebrow">
              <BookOpen size={18} />
              قاعدة معرفية متخصصة
            </span>

            <h1>دليل أفاعي فلسطين</h1>

            <p>
              ابحث بين الأنواع المسجلة، وقارن مستوى الخطورة والسمّية، وافتح صفحة
              كل نوع للاطلاع على التفاصيل.
            </p>
          </div>

          <div className="species-page__counter reveal">
            <strong>{species.length}</strong>
            <span>نوعًا مسجلًا</span>
          </div>
        </div>
      </section>

      <section className="page-container species-browser">
        <div className="species-filters reveal">
          <div className="species-search">
            <Search size={20} />

            <input
              type="search"
              value={searchTerm}
              placeholder="ابحث بالاسم العربي أو الإنجليزي أو العلمي..."
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="species-filter-group">
            <SlidersHorizontal size={19} />

            <select
              value={dangerFilter}
              onChange={(event) => setDangerFilter(event.target.value)}
            >
              <option value="ALL">جميع مستويات الخطورة</option>
              <option value="CRITICAL">شديدة الخطورة</option>
              <option value="HIGH">خطيرة</option>
              <option value="MEDIUM">متوسطة</option>
              <option value="LOW">قليلة الخطورة</option>
              <option value="UNKNOWN">غير معروفة</option>
            </select>

            <select
              value={venomFilter}
              onChange={(event) => setVenomFilter(event.target.value)}
            >
              <option value="ALL">جميع حالات السمّية</option>
              <option value="VENOMOUS">سامة</option>
              <option value="MILDLY_VENOMOUS">سامة بدرجة خفيفة</option>
              <option value="NON_VENOMOUS">غير سامة</option>
              <option value="UNKNOWN">غير معروفة</option>
            </select>
          </div>
        </div>

        <div className="species-results-header">
          <p>
            عرض <strong>{filteredSpecies.length}</strong> من أصل{" "}
            <strong>{species.length}</strong>
          </p>
        </div>

        {loading && (
          <div className="species-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <article
                key={index}
                className="species-card species-card--loading"
              >
                <div className="species-card__image skeleton" />

                <div className="species-card__body">
                  <div className="skeleton skeleton--title" />
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--small" />
                  <div className="skeleton skeleton--button" />
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="species-state species-state--error">
            <ShieldAlert size={35} />
            <h2>{error}</h2>
            <p>تأكد من أن Backend يعمل على المنفذ 3000.</p>
          </div>
        )}

        {!loading && !error && filteredSpecies.length === 0 && (
          <div className="species-state">
            <Search size={35} />
            <h2>لا توجد نتائج مطابقة</h2>
            <p>جرّب تغيير كلمة البحث أو إزالة الفلاتر.</p>
          </div>
        )}

        {!loading && !error && filteredSpecies.length > 0 && (
          <div className="species-grid">
            {filteredSpecies.map((snake, index) => {
              const dangerInfo = getDangerInfo(snake.danger_level);

              const imageUrl = getSpeciesImageUrl(snake);

              return (
                <article
                  key={snake.id}
                  className="species-card reveal"
                  style={{
                    animationDelay: `${index * 75}ms`,
                  }}
                >
                  <div className="species-card__image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={snake.arabic_name || "صورة أفعى"}
                        loading="lazy"
                      />
                    ) : (
                      <span>🐍</span>
                    )}

                    <div className="species-card__image-overlay">
                      عرض الصورة
                    </div>
                  </div>

                  <div className="species-card__body">
                    <h3>{snake.arabic_name}</h3>
                    <p>{snake.english_name}</p>
                    <small>{snake.scientific_name}</small>

                    <div className="species-card__badges">
                      <span className={`danger-badge ${dangerInfo.className}`}>
                        {dangerInfo.label}
                      </span>

                      <span className="venom-badge">
                        {snake.venom_status === "VENOMOUS"
                          ? "سامة"
                          : snake.venom_status === "MILDLY_VENOMOUS"
                            ? "سمّية خفيفة"
                            : snake.venom_status === "NON_VENOMOUS"
                              ? "غير سامة"
                              : "سمّيتها غير معروفة"}
                      </span>
                    </div>

                    <Link className="card-button" to={`/species/${snake.id}`}>
                      عرض التفاصيل
                      <ArrowLeft size={16} />
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

export default SpeciesPage;
