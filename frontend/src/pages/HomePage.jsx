import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  Camera,
  CheckCircle2,
  Globe2,
  ImageUp,
  Info,
  Leaf,
  Link2,
  MessageCircle,
  MoveLeft,
  ShieldAlert,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import mahmoudProfile from "../assets/mahmoud-profile.jpg";

const services = [
  {
    icon: ImageUp,
    title: "ارفع صورة وحلّلها",
    text: "ارفع صورة واضحة للأفعى واحصل على تحليل أولي لنوعها ومستوى خطورتها.",
    link: "/identify",
  },
  {
    icon: BookOpen,
    title: "تعرّف على الأنواع",
    text: "تصفّح دليل الأفاعي واكتشف الأنواع المنتشرة ومواصفاتها وموائلها.",
    link: "/species",
  },
  {
    icon: Bot,
    title: "اسأل المساعد",
    text: "اسأل عن الأفاعي واحصل على إجابات فورية وإرشادات سلامة واضحة.",
    link: "/chat",
  },
];

const safetyInstructions = [
  {
    icon: Camera,
    title: "التقط صورة من بعيد",
    text: "استخدم التكبير بدل الاقتراب، وحافظ دائمًا على مسافة آمنة.",
  },
  {
    icon: MoveLeft,
    title: "ابتعد بهدوء",
    text: "تحرّك ببطء واترك للأفعى مساحة كافية للابتعاد.",
  },
  {
    icon: XCircle,
    title: "لا تحاول الإمساك بها",
    text: "لا تلمس الأفعى ولا تحاول نقلها أو قتلها بنفسك.",
  },
  {
    icon: ShieldAlert,
    title: "لا تقترب",
    text: "اعتبر الأفعى خطرة ما لم يؤكد خبير مختص خلاف ذلك.",
  },
];

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
        className: "safe",
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

function getSpeciesImageUrl(species) {
  const directImage =
    species?.primary_image || species?.primaryImage || species?.image || null;

  let storageKey = getMediaStorageKey(directImage);

  if (!storageKey && Array.isArray(species?.images)) {
    const primaryImage =
      species.images.find((image) => image?.is_primary || image?.isPrimary) ||
      species.images[0];

    storageKey = getMediaStorageKey(primaryImage);
  }

  if (!storageKey) {
    return "";
  }

  return `http://localhost:3000/uploads/${storageKey}`;
}

function HomePage() {
  const [featuredSnakes, setFeaturedSnakes] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [speciesError, setSpeciesError] = useState("");

  useEffect(() => {
    let requestCancelled = false;

    async function loadFeaturedSpecies() {
      try {
        const response = await axios.get("http://localhost:3000/api/species");

        if (!requestCancelled) {
          const species = Array.isArray(response.data?.data)
            ? response.data.data
            : [];

          setFeaturedSnakes(species.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load species:", error);

        if (!requestCancelled) {
          setSpeciesError("تعذر تحميل بيانات الأفاعي");
        }
      } finally {
        if (!requestCancelled) {
          setLoadingSpecies(false);
        }
      }
    }

    loadFeaturedSpecies();

    return () => {
      requestCancelled = true;
    };
  }, []);

  const heroSnake = featuredSnakes[0] || null;
  const heroImageUrl = getSpeciesImageUrl(heroSnake);

  return (
    <>
      <section id="home" className="hero page-container">
        <div className="hero__content reveal">
          <span className="eyebrow">
            <Leaf size={18} />
            المعرفة أول خطوة نحو السلامة
          </span>

          <h1>
            تعرّف على أفاعي
            <span> فلسطين بأمان</span>
          </h1>

          <p>
            ارفع صورة، واحصل على تحليل أولي، وتعرّف على أنواع الأفاعي المنتشرة
            وطرق التعامل الآمن معها.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" to="/identify">
              <Sparkles size={19} />
              حلّل صورة أفعى
            </Link>

            <a className="button button--secondary" href="#species">
              <BookOpen size={19} />
              تصفّح دليل الأفاعي
            </a>
          </div>

          <div className="hero__stats">
            <div>
              <strong>تحليل ذكي</strong>
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>

            <div>
              <strong>معلومات موثوقة</strong>
              <span>دليل واضح ومُنظم</span>
            </div>
          </div>
        </div>

        <div className="hero__visual reveal reveal--delay">
          <div className="hero__image">
            {heroImageUrl ? (
              <img
                className="hero__real-image"
                src={heroImageUrl}
                alt={heroSnake?.arabic_name || "أفعى من دليل أفاعي فلسطين"}
              />
            ) : (
              <div className="hero__snake-placeholder">
                <span>🐍</span>
                <p>صورة الأفعى الرئيسية</p>
                <small>ستظهر هنا صورة أول نوع منشور</small>
              </div>
            )}
          </div>

          <div className="floating-card floating-card--top">
            <CheckCircle2 size={20} />
            تحليل أولي سريع
          </div>

          <div className="floating-card floating-card--bottom">
            <ShieldAlert size={20} />
            تعليمات سلامة واضحة
          </div>
        </div>
      </section>

      <section className="page-container">
        <div className="warning-banner reveal">
          <ShieldAlert size={23} />

          <p>
            <strong>تنبيه:</strong> تحليل الصور تقريبي، ولا يغني عن التواصل مع
            خبير أو خدمات الطوارئ عند وجود خطر.
          </p>
        </div>
      </section>

      <section id="identify" className="services section page-container">
        <div className="services__grid">
          {services.map(({ icon: Icon, title, text, link }, index) => (
            <Link
              key={title}
              to={link}
              className="service-card reveal"
              style={{
                animationDelay: `${index * 120}ms`,
              }}
            >
              <div className="service-card__icon">
                <Icon size={31} />
              </div>

              <h2>{title}</h2>
              <p>{text}</p>

              <span className="service-card__link">
                ابدأ الآن
                <ArrowLeft size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="species" className="section section--soft">
        <div className="page-container">
          <div className="section-heading reveal">
            <div>
              <span className="section-heading__label">استكشف الدليل</span>

              <h2>أشهر الأفاعي</h2>

              <p>تعرّف على مجموعة من الأنواع المنتشرة، ومستوى خطورة كل نوع.</p>
            </div>

            <Link className="text-link" to="/species">
              عرض جميع الأنواع
              <ArrowLeft size={18} />
            </Link>
          </div>

          <div className="species-grid">
            {loadingSpecies &&
              Array.from({ length: 4 }).map((_, index) => (
                <article
                  key={`species-loading-${index}`}
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

            {!loadingSpecies && speciesError && (
              <div className="species-error">{speciesError}</div>
            )}

            {!loadingSpecies &&
              !speciesError &&
              featuredSnakes.length === 0 && (
                <div className="species-error">
                  لا توجد أنواع أفاعٍ متاحة حاليًا.
                </div>
              )}

            {!loadingSpecies &&
              !speciesError &&
              featuredSnakes.map((snake, index) => {
                const dangerInfo = getDangerInfo(snake.danger_level);

                return (
                  <article
                    key={snake.id}
                    className="species-card reveal"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="species-card__image">
                      {getSpeciesImageUrl(snake) ? (
                        <img
                          src={getSpeciesImageUrl(snake)}
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
                      <h3>{snake.arabic_name || "اسم غير متوفر"}</h3>

                      <p>{snake.english_name || "English name unavailable"}</p>

                      <small>
                        {snake.scientific_name || "Scientific name unavailable"}
                      </small>

                      <span className={`danger-badge ${dangerInfo.className}`}>
                        {dangerInfo.label}
                      </span>

                      <Link className="card-button" to={`/species/${snake.id}`}>
                        عرض التفاصيل
                        <ArrowLeft size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>

      <section id="assistant" className="section page-container">
        <div className="section-heading reveal">
          <div>
            <span className="section-heading__label">سلامتك أولًا</span>

            <h2>تعليمات سريعة للسلامة</h2>

            <p>
              اتبع هذه الخطوات عند مشاهدة أفعى، ولا تعرض نفسك أو الآخرين للخطر.
            </p>
          </div>
        </div>

        <div className="safety-grid">
          {safetyInstructions.map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              className="safety-card reveal"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="safety-card__icon">
                <Icon size={27} />
              </div>

              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="about-project section">
        <div className="page-container">
          <div className="section-heading reveal">
            <div>
              <span className="section-heading__label">
                <UserRound size={17} />
                عن المشروع
              </span>

              <h2>من يقف خلف Afaai Guide؟</h2>

              <p>
                مشروع تقني فلسطيني يهدف إلى جعل المعرفة المتعلقة بالأفاعي
                وإرشادات السلامة أكثر سهولة ووضوحًا للجميع.
              </p>
            </div>
          </div>

          <div className="about-project__card reveal">
            <div className="about-project__image-wrapper">
              <img
                className="about-project__image"
                src={mahmoudProfile}
                alt="Mahmoud Abu Amria - Founder and Developer of Afaai Guide"
              />

              <div className="about-project__image-badge">
                Founder & Developer
              </div>
            </div>

            <div className="about-project__content">
              <span className="about-project__label">مؤسس ومطوّر المنصة</span>

              <h3>Eng. Mahmoud Abu Amria</h3>

              <p className="about-project__role">
                Software Engineer
                <span>•</span>
                Founder & Developer of Afaai Guide
              </p>

              <p className="about-project__description">
                تم تطوير Afaai Guide بهدف بناء منصة تساعد المستخدم على التعرّف
                الأولي على الأفاعي، الوصول إلى معلومات واضحة حول الأنواع،
                والحصول على إرشادات سلامة سريعة باستخدام التقنيات الحديثة
                والذكاء الاصطناعي.
              </p>

              <p className="about-project__description">
                المنصة في نسختها الأولى، وستستمر في التطور بالتعاون مع الخبراء
                بهدف تحسين دقة المعلومات وتجربة الاستخدام وتوسيع قاعدة الأنواع
                مستقبلًا.
              </p>

              <div className="about-project__socials">
                <a
                  className="about-social-link about-social-link--whatsapp"
                  href="https://wa.me/972595736942"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="التواصل عبر واتساب"
                >
                  <MessageCircle size={20} />

                  <span>
                    <strong>WhatsApp</strong>
                    <small>تواصل معي</small>
                  </span>
                </a>

                <a
                  className="about-social-link"
                  href="https://www.linkedin.com/in/mahmoud-abu-amria"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <Link2 size={20} />

                  <span>
                    <strong>LinkedIn</strong>
                    <small>الملف المهني</small>
                  </span>
                </a>

                <a
                  className="about-social-link"
                  href="https://www.facebook.com/mahmmoud.farhan.2025"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <Globe2  size={20} />

                  <span>
                    <strong>Facebook</strong>
                    <small>حسابي الشخصي</small>
                  </span>
                </a>
              </div>

              <div className="about-project__note">
                <Info size={18} />

                <p>
                  Afaai Guide أداة مساعدة وليست بديلًا عن المختصين أو الجهات
                  الطبية والطوارئ في الحالات الخطرة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="page-container final-cta__content reveal">
          <div>
            <span>
              <Info size={18} />
              ابدأ باستخدام المنصة
            </span>

            <h2>هل شاهدت أفعى ولا تعرف نوعها؟</h2>

            <p>
              التقط صورة من مسافة آمنة، ودع النظام يساعدك في الحصول على تحليل
              أولي.
            </p>
          </div>

          <Link className="button button--light" to="/identify">
            <ImageUp size={20} />
            ارفع الصورة الآن
          </Link>
        </div>
      </section>
    </>
  );
}

export default HomePage;
