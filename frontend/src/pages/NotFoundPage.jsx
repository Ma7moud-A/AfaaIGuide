import { ArrowRight, Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <section className="page-container not-found-page__content">
        <div className="not-found-card">
          <div className="not-found-card__icon">
            <SearchX size={42} />
          </div>

          <span className="not-found-card__code">
            404
          </span>

          <h1>الصفحة غير موجودة</h1>

          <p>
            الرابط الذي حاولت الوصول إليه غير موجود أو ربما تم تغييره.
          </p>

          <div className="not-found-card__actions">
            <Link
              className="button button--primary"
              to="/"
            >
              <Home size={18} />
              العودة إلى الرئيسية
            </Link>

            <Link
              className="button button--secondary"
              to="/species"
            >
              دليل الأفاعي
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
export default NotFoundPage;