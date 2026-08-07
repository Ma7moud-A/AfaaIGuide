import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bot,
  BookOpen,
  Home,
  ImageUp,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
  PlusCircle,
  ClipboardList,
  FileCheck2,
} from "lucide-react";

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("afaai_user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to read stored user:", error);
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    setMenuOpen(false);
    setUser(getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    function handleStorageChange() {
      setUser(getStoredUser());
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("afaai-auth-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      window.removeEventListener("afaai-auth-change", handleStorageChange);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("afaai_token");
    localStorage.removeItem("afaai_user");

    setUser(null);
    closeMenu();

    window.dispatchEvent(new Event("afaai-auth-change"));

    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="page-container navbar__content">
        <Link to="/" className="navbar__brand" onClick={closeMenu}>
          <div className="brand__logo">أ</div>

          <div className="brand__text">
            <strong>Afaai Guide</strong>
            <span>دليل أفاعي فلسطين</span>
          </div>
        </Link>

        <button
          type="button"
          className="navbar__menu-button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav
          className={`navbar__links ${menuOpen ? "navbar__links--open" : ""}`}
        >
          <Link
            to="/"
            className={
              location.pathname === "" || location.pathname === "/"
                ? "is-active"
                : ""
            }
            onClick={closeMenu}
          >
            <Home size={17} />
            الرئيسية
          </Link>

          <Link
            to="/species"
            className={
              location.pathname.startsWith("/species") ? "is-active" : ""
            }
            onClick={closeMenu}
          >
            <BookOpen size={17} />
            دليل الأفاعي
          </Link>

          <Link
            to="/identify"
            className={location.pathname === "/identify" ? "is-active" : ""}
            onClick={closeMenu}
          >
            <ImageUp size={17} />
            تعرّف على أفعى
          </Link>

          <Link
            to="/chat"
            className={location.pathname === "/chat" ? "is-active" : ""}
            onClick={closeMenu}
          >
            <Bot size={17} />
            المساعد
          </Link>
          {user?.roles?.some((role) =>
            ["CONTENT_ADMIN", "ADMIN"].includes(role),
          ) && (
            <Link
              to="/content/submissions"
              className={
                location.pathname.startsWith("/content") ? "is-active" : ""
              }
              onClick={closeMenu}
            >
              <FileCheck2 size={17} />
              مراجعة الاقتراحات
            </Link>
          )}
          {user?.roles?.some((role) => ["EXPERT", "ADMIN"].includes(role)) && (
            <Link
              to="/expert/submissions/new"
              className={
                location.pathname.startsWith("/expert") ? "is-active" : ""
              }
              onClick={closeMenu}
            >
              <PlusCircle size={17} />
              إضافة أفعى
            </Link>
          )}
          {user?.roles?.some((role) => ["EXPERT", "ADMIN"].includes(role)) && (
            <Link
              to="/expert/submissions"
              className={
                location.pathname === "/expert/submissions" ? "is-active" : ""
              }
              onClick={closeMenu}
            >
              <ClipboardList size={17} />
              اقتراحاتي
            </Link>
          )}

          {!user ? (
            <Link className="navbar__login" to="/login" onClick={closeMenu}>
              <LogIn size={17} />
              تسجيل الدخول
            </Link>
          ) : (
            <div className="navbar__user-area">
              <div className="navbar__user-info">
                <div className="navbar__user-avatar">
                  {user.roles?.some((role) =>
                    ["EXPERT", "ADMIN", "CONTENT_ADMIN"].includes(role),
                  ) ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <User size={18} />
                  )}
                </div>

                <div>
                  <strong>{user.username || user.email || "المستخدم"}</strong>

                  <span>{getRoleLabel(user.roles)}</span>
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
