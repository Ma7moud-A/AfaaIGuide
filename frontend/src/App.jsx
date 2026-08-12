import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SpeciesPage from "./pages/SpeciesPage";
import SpeciesDetailsPage from "./pages/SpeciesDetailsPage";
import IdentifyPage from "./pages/IdentifyPage";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ExpertSubmissionPage from "./pages/ExpertSubmissionPage";
import ExpertSubmissionsPage from "./pages/ExpertSubmissionsPage";
import ExpertSubmissionDetailsPage from "./pages/ExpertSubmissionDetailsPage";
import ContentSubmissionsPage from "./pages/ContentSubmissionsPage";
import ContentSubmissionReviewPage from "./pages/ContentSubmissionReviewPage";
import ContentSpeciesPage from "./pages/ContentSpeciesPage";
import ContentSpeciesEditPage from "./pages/ContentSpeciesEditPage";
import NotFoundPage from "./pages/NotFoundPage";
import ScrollToTop from "./components/ScrollToTop";
import PrivacyPage from "./pages/PrivacyPage";
import DisclaimerPage from "./pages/DisclaimerPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app" dir="rtl">
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/species" element={<SpeciesPage />} />

          <Route path="/species/:id" element={<SpeciesDetailsPage />} />
          <Route path="/identify" element={<IdentifyPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/expert/submissions/new"
            element={<ExpertSubmissionPage />}
          />
          <Route
            path="/expert/submissions"
            element={<ExpertSubmissionsPage />}
          />
          <Route
            path="/expert/submissions/:id"
            element={<ExpertSubmissionDetailsPage />}
          />
          <Route
            path="/content/submissions"
            element={<ContentSubmissionsPage />}
          />
          <Route
            path="/content/submissions/:id"
            element={<ContentSubmissionReviewPage />}
          />
          <Route path="/content/species" element={<ContentSpeciesPage />} />

          <Route
            path="/content/species/:id/edit"
            element={<ContentSpeciesEditPage />}
          />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <footer className="footer">
          <div className="page-container footer__content">
            <div className="footer__brand">
              <div className="brand__logo brand__logo--footer">أ</div>

              <div>
                <strong>Afaai Guide</strong>
                <p>دليل أفاعي فلسطين</p>
              </div>
            </div>

            <div>
              <h3>المعلومات</h3>
              <a href="#about">عن المشروع</a>
              <Link to="/privacy">سياسة الخصوصية</Link>
              <Link to="/disclaimer">إخلاء المسؤولية</Link>
            </div>

            <div>
              <h3>روابط سريعة</h3>
              <a href="/">الرئيسية</a>
              <a href="/species">دليل الأفاعي</a>
              <a href="/#identify">تحليل صورة</a>
            </div>
          </div>

          <p className="footer__copyright">
            جميع الحقوق محفوظة © 2026 Afaai Guide
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
