import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Crown,
  ImagePlus,
  Images,
  LoaderCircle,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

const API_URL = "http://localhost:3000/api";
const BACKEND_URL = "http://localhost:3000";

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("afaai_user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    return null;
  }
}

function getImageStorageKey(image) {
  return (
    image?.storage_key ||
    image?.media_asset?.storage_key ||
    ""
  );
}

function getImageUrl(image) {
  const storageKey =
    getImageStorageKey(image);

  if (!storageKey) {
    return "";
  }

  return `${BACKEND_URL}/uploads/${storageKey}`;
}

function normalizeImage(image) {
  if (!image) {
    return null;
  }

  return {
    ...image,

    storage_key:
      getImageStorageKey(image),

    original_filename:
      image.original_filename ||
      image.media_asset?.original_filename ||
      "",

    mime_type:
      image.mime_type ||
      image.media_asset?.mime_type ||
      "",

    width:
      image.width ||
      image.media_asset?.width ||
      null,

    height:
      image.height ||
      image.media_asset?.height ||
      null,

    is_primary:
      Boolean(image.is_primary),
  };
}

function ContentSpeciesEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const user = getStoredUser();
  const token =
    localStorage.getItem("afaai_token");

  const isContentAdmin =
    useMemo(() => {
      return user?.roles?.some(
        (role) =>
          [
            "CONTENT_ADMIN",
            "ADMIN",
          ].includes(role)
      );
    }, [user]);

  const [formData, setFormData] =
    useState({
      animal_group_id: "",
      arabic_name: "",
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

  const [images, setImages] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [deletingImageId, setDeletingImageId] =
    useState(null);

  const [settingPrimaryId, setSettingPrimaryId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let requestCancelled = false;

    async function loadSpecies() {
      if (
        !token ||
        !isContentAdmin
      ) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await axios.get(
            `${API_URL}/species/${id}`
          );

        if (requestCancelled) {
          return;
        }

        const snake =
          response.data?.data;

        if (!snake) {
          setError(
            "لم يتم العثور على النوع."
          );

          return;
        }

        setFormData({
          animal_group_id:
            snake.animal_group_id ?? "",

          arabic_name:
            snake.arabic_name ?? "",

          english_name:
            snake.english_name ?? "",

          scientific_name:
            snake.scientific_name ?? "",

          description:
            snake.description ?? "",

          venom_status:
            snake.venom_status ??
            "UNKNOWN",

          danger_level:
            snake.danger_level ??
            "UNKNOWN",

          minimum_size_cm:
            snake.minimum_size_cm ??
            "",

          maximum_size_cm:
            snake.maximum_size_cm ??
            "",

          behavior:
            snake.behavior ?? "",

          what_to_do:
            snake.what_to_do ?? "",

          what_not_to_do:
            snake.what_not_to_do ??
            "",
        });

        const loadedImages =
          Array.isArray(snake.images)
            ? snake.images
                .map(normalizeImage)
                .filter(Boolean)
            : [];

        setImages(loadedImages);
      } catch (requestError) {
        console.error(
          "Failed to load species:",
          requestError
        );

        if (!requestCancelled) {
          setError(
            requestError.response
              ?.data?.message ||
              "تعذر تحميل بيانات النوع."
          );
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
  }, [
    id,
    token,
    isContentAdmin,
  ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  async function handleImageUpload(
    event
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "يسمح فقط بصور JPEG أو PNG أو WebP."
      );

      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      setError(
        "حجم الصورة يجب ألا يتجاوز 8 MB."
      );

      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      const body =
        new FormData();

      body.append(
        "image",
        file
      );

      const response =
        await axios.post(
          `${API_URL}/species/${id}/images`,
          body,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const createdImage =
        normalizeImage(
          response.data?.data
            ?.image
        );

      if (createdImage) {
        setImages(
          (currentImages) => [
            ...currentImages,
            createdImage,
          ]
        );
      }

      setSuccess(
        "تمت إضافة الصورة بنجاح."
      );
    } catch (requestError) {
      console.error(
        "Failed to upload species image:",
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
          "تعذر إضافة الصورة."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSetPrimaryImage(
    image
  ) {
    if (
      image.is_primary ||
      settingPrimaryId ||
      deletingImageId ||
      uploadingImage
    ) {
      return;
    }

    try {
      setSettingPrimaryId(
        image.id
      );

      setError("");
      setSuccess("");

      await axios.patch(
        `${API_URL}/species/${id}/images/${image.id}/primary`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setImages(
        (currentImages) =>
          currentImages.map(
            (currentImage) => ({
              ...currentImage,

              is_primary:
                currentImage.id ===
                image.id,
            })
          )
      );

      setSuccess(
        "تم تغيير الصورة الرئيسية بنجاح."
      );
    } catch (requestError) {
      console.error(
        "Failed to set primary image:",
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
          "تعذر تغيير الصورة الرئيسية."
      );
    } finally {
      setSettingPrimaryId(
        null
      );
    }
  }

  async function handleDeleteImage(
    image
  ) {
    if (
      deletingImageId ||
      settingPrimaryId ||
      uploadingImage
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        image.is_primary
          ? "هذه هي الصورة الرئيسية حاليًا. هل تريد حذفها؟ سيتم اختيار صورة أخرى كرئيسية تلقائيًا إذا كانت موجودة."
          : "هل أنت متأكد من حذف هذه الصورة من النوع؟"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingImageId(
        image.id
      );

      setError("");
      setSuccess("");

      await axios.delete(
        `${API_URL}/species/${id}/images/${image.id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setImages(
        (currentImages) => {
          const remaining =
            currentImages.filter(
              (currentImage) =>
                currentImage.id !==
                image.id
            );

          if (
            image.is_primary &&
            remaining.length > 0 &&
            !remaining.some(
              (currentImage) =>
                currentImage.is_primary
            )
          ) {
            return remaining.map(
              (
                currentImage,
                index
              ) => ({
                ...currentImage,

                is_primary:
                  index === 0,
              })
            );
          }

          return remaining;
        }
      );

      setSuccess(
        "تم حذف الصورة من النوع بنجاح."
      );
    } catch (requestError) {
      console.error(
        "Failed to delete species image:",
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
          "تعذر حذف الصورة."
      );
    } finally {
      setDeletingImageId(
        null
      );
    }
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const requiredFields = [
      "arabic_name",
      "english_name",
      "scientific_name",
      "description",
      "behavior",
      "what_to_do",
      "what_not_to_do",
    ];

    const missingField =
      requiredFields.some(
        (field) =>
          !formData[field].trim()
      );

    if (missingField) {
      setError(
        "يجب تعبئة جميع الحقول المطلوبة."
      );

      return;
    }

    if (
      !formData.animal_group_id
    ) {
      setError(
        "مجموعة الحيوان غير موجودة."
      );

      return;
    }

    const minimumSize =
      formData.minimum_size_cm ===
      ""
        ? null
        : Number(
            formData.minimum_size_cm
          );

    const maximumSize =
      formData.maximum_size_cm ===
      ""
        ? null
        : Number(
            formData.maximum_size_cm
          );

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

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await axios.put(
        `${API_URL}/species/${id}`,
        {
          animal_group_id:
            Number(
              formData.animal_group_id
            ),

          arabic_name:
            formData.arabic_name.trim(),

          english_name:
            formData.english_name.trim(),

          scientific_name:
            formData.scientific_name.trim(),

          description:
            formData.description.trim(),

          venom_status:
            formData.venom_status,

          danger_level:
            formData.danger_level,

          minimum_size_cm:
            minimumSize,

          maximum_size_cm:
            maximumSize,

          behavior:
            formData.behavior.trim(),

          what_to_do:
            formData.what_to_do.trim(),

          what_not_to_do:
            formData.what_not_to_do.trim(),
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        "تم حفظ تعديلات النوع بنجاح."
      );

      setTimeout(() => {
        navigate(
          "/content/species"
        );
      }, 1000);
    } catch (requestError) {
      console.error(
        "Failed to update species:",
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
          "تعذر حفظ التعديلات."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!token || !user) {
    return (
      <main className="protected-state-page">
        <div className="protected-state-card">
          <ShieldCheck
            size={45}
          />

          <h1>
            تسجيل الدخول مطلوب
          </h1>

          <p>
            يجب تسجيل الدخول
            بحساب مدير محتوى.
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
          <ShieldCheck
            size={45}
          />

          <h1>
            غير مصرح لك بالدخول
          </h1>

          <p>
            هذه الصفحة مخصصة
            لمدير المحتوى أو مدير
            النظام.
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
      <main className="content-species-edit-page">
        <div className="content-species-loading">
          <LoaderCircle
            className="spinning-icon"
            size={42}
          />

          <p>
            جاري تحميل بيانات
            النوع...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="content-species-edit-page">
      <section className="content-species-edit-hero">
        <div className="page-container">
          <Link
            className="submission-back-link"
            to="/content/species"
          >
            <ArrowRight
              size={18}
            />

            العودة إلى إدارة الأنواع
          </Link>

          <span className="eyebrow">
            <ShieldCheck
              size={18}
            />

            إدارة المحتوى
          </span>

          <h1>
            تعديل بيانات النوع
          </h1>

          <p>
            عدّل البيانات والصور
            ثم احفظ التغييرات لتظهر
            مباشرة في دليل الأفاعي.
          </p>
        </div>
      </section>

      <section className="page-container content-species-edit-container">

        {/* =========================
            Species images
            ========================= */}

        <section className="species-images-manager">
          <div className="species-images-manager__header">
            <div>
              <span className="eyebrow">
                <Images size={18} />
                صور النوع
              </span>

              <h2>
                إدارة صور الأفعى
              </h2>

              <p>
                أضف الصور أو احذفها
                أو اختر الصورة التي
                ستظهر كرئيسية في
                الدليل.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={
                  handleImageUpload
                }
              />

              <button
                type="button"
                className="button button--primary"
                disabled={
                  uploadingImage
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                {uploadingImage ? (
                  <>
                    <LoaderCircle
                      className="spinning-icon"
                      size={18}
                    />
                    جاري رفع الصورة...
                  </>
                ) : (
                  <>
                    <ImagePlus
                      size={18}
                    />
                    إضافة صورة
                  </>
                )}
              </button>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="species-images-empty">
              <Images size={40} />

              <h3>
                لا توجد صور لهذا
                النوع
              </h3>

              <p>
                يمكنك إضافة أول صورة
                باستخدام زر إضافة
                صورة.
              </p>
            </div>
          ) : (
            <div className="species-images-grid">
              {images.map(
                (image) => {
                  const imageUrl =
                    getImageUrl(
                      image
                    );

                  return (
                    <article
                      key={image.id}
                      className={`species-image-card ${
                        image.is_primary
                          ? "species-image-card--primary"
                          : ""
                      }`}
                    >
                      <div className="species-image-card__preview">
                        {imageUrl ? (
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              formData.arabic_name ||
                              "صورة الأفعى"
                            }
                          />
                        ) : (
                          <span>
                            🐍
                          </span>
                        )}

                        {image.is_primary && (
                          <div className="species-image-primary-badge">
                            <Crown
                              size={15}
                            />
                            الصورة الرئيسية
                          </div>
                        )}
                      </div>

                      <div className="species-image-card__actions">
                        {!image.is_primary && (
                          <button
                            type="button"
                            className="species-image-action species-image-action--primary"
                            disabled={
                              settingPrimaryId ===
                                image.id ||
                              Boolean(
                                deletingImageId
                              ) ||
                              uploadingImage
                            }
                            onClick={() =>
                              handleSetPrimaryImage(
                                image
                              )
                            }
                          >
                            {settingPrimaryId ===
                            image.id ? (
                              <>
                                <LoaderCircle
                                  className="spinning-icon"
                                  size={16}
                                />

                                جاري التغيير...
                              </>
                            ) : (
                              <>
                                <Crown
                                  size={16}
                                />

                                جعلها رئيسية
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          className="species-image-action species-image-action--delete"
                          disabled={
                            deletingImageId ===
                              image.id ||
                            Boolean(
                              settingPrimaryId
                            ) ||
                            uploadingImage
                          }
                          onClick={() =>
                            handleDeleteImage(
                              image
                            )
                          }
                        >
                          {deletingImageId ===
                          image.id ? (
                            <>
                              <LoaderCircle
                                className="spinning-icon"
                                size={16}
                              />

                              جاري الحذف...
                            </>
                          ) : (
                            <>
                              <Trash2
                                size={16}
                              />

                              حذف الصورة
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =========================
            Species text data
            ========================= */}

        <form
          className="content-species-edit-form"
          onSubmit={handleSubmit}
        >
          <div className="publish-species-grid">
            <label className="expert-field">
              <span>
                الاسم العربي
                <strong>*</strong>
              </span>

              <input
                name="arabic_name"
                type="text"
                value={
                  formData.arabic_name
                }
                disabled={saving}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field">
              <span>
                الاسم الإنجليزي
                <strong>*</strong>
              </span>

              <input
                name="english_name"
                type="text"
                value={
                  formData.english_name
                }
                disabled={saving}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field expert-field--full">
              <span>
                الاسم العلمي
                <strong>*</strong>
              </span>

              <input
                name="scientific_name"
                type="text"
                value={
                  formData.scientific_name
                }
                disabled={saving}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field">
              <span>
                حالة السمّية
              </span>

              <select
                name="venom_status"
                value={
                  formData.venom_status
                }
                disabled={saving}
                onChange={handleChange}
              >
                <option value="UNKNOWN">
                  غير معروفة
                </option>

                <option value="VENOMOUS">
                  سامة
                </option>

                <option value="MILDLY_VENOMOUS">
                  سامة بدرجة خفيفة
                </option>

                <option value="NON_VENOMOUS">
                  غير سامة
                </option>
              </select>
            </label>

            <label className="expert-field">
              <span>
                مستوى الخطورة
              </span>

              <select
                name="danger_level"
                value={
                  formData.danger_level
                }
                disabled={saving}
                onChange={handleChange}
              >
                <option value="UNKNOWN">
                  غير معروف
                </option>

                <option value="LOW">
                  قليل الخطورة
                </option>

                <option value="MEDIUM">
                  متوسط
                </option>

                <option value="HIGH">
                  خطير
                </option>

                <option value="CRITICAL">
                  شديد الخطورة
                </option>
              </select>
            </label>

            <label className="expert-field">
              <span>
                الحد الأدنى للطول — سم
              </span>

              <input
                name="minimum_size_cm"
                type="number"
                min="1"
                step="0.1"
                value={
                  formData.minimum_size_cm
                }
                disabled={saving}
                onChange={handleChange}
              />
            </label>

            <label className="expert-field">
              <span>
                الحد الأقصى للطول — سم
              </span>

              <input
                name="maximum_size_cm"
                type="number"
                min="1"
                step="0.1"
                value={
                  formData.maximum_size_cm
                }
                disabled={saving}
                onChange={handleChange}
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
                value={
                  formData.description
                }
                disabled={saving}
                onChange={handleChange}
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
                value={
                  formData.behavior
                }
                disabled={saving}
                onChange={handleChange}
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
                value={
                  formData.what_to_do
                }
                disabled={saving}
                onChange={handleChange}
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
                value={
                  formData.what_not_to_do
                }
                disabled={saving}
                onChange={handleChange}
              />
            </label>
          </div>

          {error && (
            <div className="expert-form-message expert-form-message--error">
              <AlertTriangle
                size={21}
              />

              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="expert-form-message expert-form-message--success">
              <CheckCircle2
                size={22}
              />

              <p>
                {success}
              </p>
            </div>
          )}

          <div className="content-species-edit-actions">
            <Link
              className="button button--secondary"
              to="/content/species"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    className="spinning-icon"
                    size={19}
                  />

                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save
                    size={19}
                  />

                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ContentSpeciesEditPage;