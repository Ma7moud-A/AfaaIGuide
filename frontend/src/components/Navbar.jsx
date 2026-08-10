import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Bot,
  BookOpen,
  ClipboardList,
  Database,
  FileCheck2,
  Home,
  ImageUp,
  LogIn,
  LogOut,
  PlusCircle,
  ShieldCheck,
  User,
} from "lucide-react";

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("afaai_user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      "Failed to read stored user:",
      error
    );

    return null;
  }
}

function getRoleLabel(roles = []) {
  if (roles.includes("ADMIN")) {
    return "مدير النظام";
  }

  if (roles.includes("CONTENT_ADMIN")) {
    return "مدير المحتوى";
  }

  if (roles.includes("EXPERT")) {
    return "خبير أفاعٍ";
  }

  return "مستخدم";
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] =
    useState(getStoredUser);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    function handleStorageChange() {
      setUser(getStoredUser());
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "afaai-auth-change",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "afaai-auth-change",
        handleStorageChange
      );
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("afaai_token");
    localStorage.removeItem("afaai_user");

    setUser(null);

    window.dispatchEvent(
      new Event("afaai-auth-change")
    );

    navigate("/");
  }

  const isContentAdmin =
    user?.roles?.some((role) =>
      ["CONTENT_ADMIN", "ADMIN"].includes(role)
    );

  const isExpert =
    user?.roles?.some((role) =>
      ["EXPERT", "ADMIN"].includes(role)
    );

  return (
    <header className="navbar">
      <div className="page-container navbar__content">
        <Link
          className="brand"
          to="/"
        >
          <div className="brand__logo">
            أ
          </div>

          <div className="brand__text">
            <strong>
              Afaai Guide
            </strong>

            <span>
              دليل أفاعي فلسطين
            </span>
          </div>
        </Link>

        <nav className="navbar__links">
          <Link
            to="/"
            className={
              location.pathname === "/"
                ? "is-active"
                : ""
            }
          >
            <Home size={17} />
            الرئيسية
          </Link>

          <Link
            to="/species"
            className={
              location.pathname.startsWith(
                "/species"
              )
                ? "is-active"
                : ""
            }
          >
            <BookOpen size={17} />
            دليل الأفاعي
          </Link>

          <Link
            to="/identify"
            className={
              location.pathname ===
              "/identify"
                ? "is-active"
                : ""
            }
          >
            <ImageUp size={17} />
            تعرّف على أفعى
          </Link>

          <Link
            to="/chat"
            className={
              location.pathname === "/chat"
                ? "is-active"
                : ""
            }
          >
            <Bot size={17} />
            المساعد
          </Link>

          {isContentAdmin && (
            <>
              <Link
                to="/content/submissions"
                className={
                  location.pathname.startsWith(
                    "/content/submissions"
                  )
                    ? "is-active"
                    : ""
                }
              >
                <FileCheck2 size={17} />
                مراجعة الاقتراحات
              </Link>

              <Link
                to="/content/species"
                className={
                  location.pathname.startsWith(
                    "/content/species"
                  )
                    ? "is-active"
                    : ""
                }
              >
                <Database size={17} />
                إدارة الأنواع
              </Link>
            </>
          )}

          {isExpert && (
            <>
              <Link
                to="/expert/submissions/new"
                className={
                  location.pathname ===
                  "/expert/submissions/new"
                    ? "is-active"
                    : ""
                }
              >
                <PlusCircle size={17} />
                إضافة أفعى
              </Link>

              <Link
                to="/expert/submissions"
                className={
                  location.pathname ===
                  "/expert/submissions" ||
                  (
                    location.pathname.startsWith(
                      "/expert/submissions/"
                    ) &&
                    location.pathname !==
                      "/expert/submissions/new"
                  )
                    ? "is-active"
                    : ""
                }
              >
                <ClipboardList size={17} />
                اقتراحاتي
              </Link>
            </>
          )}

          {!user ? (
            <Link
              className="navbar__login"
              to="/login"
            >
              <LogIn size={17} />
              تسجيل الدخول
            </Link>
          ) : (
            <div className="navbar__user-area">
              <div className="navbar__user-info">
                <div className="navbar__user-avatar">
                  {user.roles?.some(
                    (role) =>
                      [
                        "EXPERT",
                        "ADMIN",
                        "CONTENT_ADMIN",
                      ].includes(role)
                  ) ? (
                    <ShieldCheck
                      size={18}
                    />
                  ) : (
                    <User size={18} />
                  )}
                </div>

                <div>
                  <strong>
                    {user.username ||
                      user.email ||
                      "المستخدم"}
                  </strong>

                  <span>
                    {getRoleLabel(
                      user.roles
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="navbar__logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                تسجيل الخروج
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;