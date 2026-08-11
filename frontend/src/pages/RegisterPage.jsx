import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import { API_URL } from "../config/api";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const username = formData.username.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!username || !email || !password || !confirmPassword) {
      setError("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    if (username.length < 3) {
      setError("يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل.");
      return;
    }

    if (!email.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    if (password.length < 8) {
      setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          username,
          email,
          password,
        }
      );

      const responseData =
        response.data?.data || response.data || {};

      const token =
        responseData.token ||
        response.data?.token;

      const user =
        responseData.user ||
        response.data?.user ||
        null;

      if (token) {
        localStorage.setItem("afaai_token", token);
      }

      if (user) {
        localStorage.setItem(
          "afaai_user",
          JSON.stringify(user)
        );
      }
      window.dispatchEvent(
  new Event("afaai-auth-change")
);  
      navigate("/");
    } catch (requestError) {
      console.error("Registration failed:", requestError);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "تعذر إنشاء الحساب. حاول مرة أخرى."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout page-container">
        <div className="auth-visual reveal">
          <div className="auth-visual__content">
            <div className="auth-visual__icon">
              <UserPlus size={45} />
            </div>

            <span>انضم إلى المنصة</span>

            <h1>
              أنشئ حسابك في
              <strong> Afaai Guide</strong>
            </h1>

            <p>
              احفظ محادثاتك ونتائج التحليل، وارجع إليها
              بسهولة في أي وقت.
            </p>

            <div className="auth-benefits">
              <div>
                <CheckCircle2 size={20} />
                <span>إنشاء حساب خلال ثوانٍ</span>
              </div>

              <div>
                <ShieldCheck size={20} />
                <span>بياناتك محمية</span>
              </div>

              <div>
                <LockKeyhole size={20} />
                <span>كلمة المرور تُخزّن بشكل مشفّر</span>
              </div>
            </div>
          </div>

          <div className="auth-visual__snake">🐍</div>
        </div>

        <section className="auth-card reveal reveal--delay">
          <div className="auth-card__heading">
            <div className="auth-card__logo">
              <UserPlus size={27} />
            </div>

            <div>
              <h2>إنشاء حساب</h2>
              <p>أدخل بياناتك للانضمام إلى المنصة.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="username">
              اسم المستخدم
            </label>

            <div className="auth-input">
              <User size={19} />

              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                placeholder="مثال: farhan_user"
                autoComplete="username"
                disabled={submitting}
                onChange={handleChange}
              />
            </div>

            <label htmlFor="email">
              البريد الإلكتروني
            </label>

            <div className="auth-input">
              <Mail size={19} />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                placeholder="example@email.com"
                autoComplete="email"
                disabled={submitting}
                onChange={handleChange}
              />
            </div>

            <label htmlFor="password">
              كلمة المرور
            </label>

            <div className="auth-input">
              <LockKeyhole size={19} />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                placeholder="8 أحرف على الأقل"
                autoComplete="new-password"
                disabled={submitting}
                onChange={handleChange}
              />

              <button
                type="button"
                className="auth-password-toggle"
                aria-label={
                  showPassword
                    ? "إخفاء كلمة المرور"
                    : "إظهار كلمة المرور"
                }
                onClick={() =>
                  setShowPassword((current) => !current)
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            <label htmlFor="confirmPassword">
              تأكيد كلمة المرور
            </label>

            <div className="auth-input">
              <LockKeyhole size={19} />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={formData.confirmPassword}
                placeholder="أعد كتابة كلمة المرور"
                autoComplete="new-password"
                disabled={submitting}
                onChange={handleChange}
              />

              <button
                type="button"
                className="auth-password-toggle"
                aria-label={
                  showConfirmPassword
                    ? "إخفاء كلمة المرور"
                    : "إظهار كلمة المرور"
                }
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            {error && (
              <div className="auth-error">
                <LockKeyhole size={19} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="button button--primary auth-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="spinning-icon"
                    size={20}
                  />
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>أو</span>
          </div>

          <p className="auth-register-link">
            لديك حساب بالفعل؟
            <Link to="/login">
              تسجيل الدخول
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}

export default RegisterPage;