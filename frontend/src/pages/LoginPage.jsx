import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { API_URL } from "../config/api";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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

  const identifier = formData.identifier.trim();
  const password = formData.password;

  if (!identifier || !password) {
    setError(
      "يرجى إدخال اسم المستخدم أو البريد وكلمة المرور."
    );
    return;
  }

  setSubmitting(true);
  setError("");

  try {
    const loginResponse = await axios.post(
      `${API_URL}/auth/login`,
      {
        identifier,
        password,
      }
    );

    const token =
      loginResponse.data?.token ||
      loginResponse.data?.data?.token;

    if (!token) {
      throw new Error(
        "لم يصل رمز تسجيل الدخول من الخادم."
      );
    }

    localStorage.setItem("afaai_token", token);

    const userResponse = await axios.get(
      `${API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const user =
      userResponse.data?.data?.user ||
      userResponse.data?.data ||
      userResponse.data?.user ||
      userResponse.data;

    if (!user) {
      throw new Error(
        "تم تسجيل الدخول، لكن تعذر تحميل بيانات المستخدم."
      );
    }

    localStorage.setItem(
      "afaai_user",
      JSON.stringify(user)
    );

    window.dispatchEvent(
      new Event("afaai-auth-change")
    );

    navigate("/");
  } catch (requestError) {
    console.error("Login failed:", requestError);

    localStorage.removeItem("afaai_token");
    localStorage.removeItem("afaai_user");

    setError(
      requestError.response?.data?.message ||
        requestError.message ||
        "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى."
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
              <ShieldCheck size={45} />
            </div>

            <span>مرحبًا بعودتك</span>

            <h1>
              سجّل دخولك إلى
              <strong> Afaai Guide</strong>
            </h1>

            <p>
              تابع محادثاتك السابقة، واحفظ الأنواع المفضلة، واستخدم الأدوات
              المتاحة لحسابك.
            </p>

            <div className="auth-benefits">
              <div>
                <ShieldCheck size={20} />
                <span>حساب محمي وآمن</span>
              </div>

              <div>
                <KeyRound size={20} />
                <span>صلاحيات حسب دور المستخدم</span>
              </div>

              <div>
                <LockKeyhole size={20} />
                <span>حفظ جلساتك وبياناتك</span>
              </div>
            </div>
          </div>

          <div className="auth-visual__snake">🐍</div>
        </div>

        <section className="auth-card reveal reveal--delay">
          <div className="auth-card__heading">
            <div className="auth-card__logo">
              <LogIn size={27} />
            </div>

            <div>
              <h2>تسجيل الدخول</h2>
              <p>أدخل بيانات حسابك للمتابعة.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="identifier">
              اسم المستخدم أو البريد الإلكتروني
            </label>

            <div className="auth-input">
              <Mail size={19} />

              <input
                id="identifier"
                name="identifier"
                type="text"
                value={formData.identifier}
                placeholder="example@email.com"
                autoComplete="username"
                disabled={submitting}
                onChange={handleChange}
              />
            </div>

            <div className="auth-label-row">
              <label htmlFor="password">كلمة المرور</label>

              <button type="button">نسيت كلمة المرور؟</button>
            </div>

            <div className="auth-input">
              <LockKeyhole size={19} />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                disabled={submitting}
                onChange={handleChange}
              />

              <button
                type="button"
                className="auth-password-toggle"
                aria-label={
                  showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                }
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
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
                  <LoaderCircle className="spinning-icon" size={20} />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>أو</span>
          </div>

          <p className="auth-register-link">
            لا تملك حسابًا؟
            <Link to="/register">
              <UserPlus size={17} />
              إنشاء حساب جديد
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}

export default LoginPage;
