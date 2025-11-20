import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useParams,
  useSearchParams,
} from "react-router-dom";
import api from "./services/api";
import "./components/AuthModal.css";
import { LanguageProvider } from "./context/LanguageContext"; // <<< أضف هذا
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUS";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Me from "./pages/me";
import CVPrompt from "./pages/CVPrompt";
import CVGenerator from "./pages/CVGenerator";
import Settings from "./pages/Settings";
import FindJobs from "./pages/FindJobs";
import Companies from "./pages/Companies";
import CareerAdvice from "./pages/CareerAdvice";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Cookies from "./pages/Cookies";
import Accessibility from "./pages/Accessibility";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import SavedJobs from "./pages/SavedJobs";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <LanguageProvider> {/* <<< لف كل التطبيق بالـ LanguageProvider */}
      <Router>
        <Routes>
          {/* Single layout route for ALL pages */}
          <Route element={<MainLayout />}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cv-prompt" element={<CVPrompt />} />
            <Route path="/cv-generator" element={<CVGenerator />} />
            <Route path="/find-jobs" element={<FindJobs />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/career-advice" element={<CareerAdvice />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/accessibility" element={<Accessibility />} />
            
            {/* Protected routes */}
            <Route 
              path="/me" 
              element={
                <ProtectedRoute>
                  <Me />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications" 
              element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/saved-jobs" 
              element={
                <ProtectedRoute>
                  <SavedJobs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Reset Password Route - redirects to home with token */}
          <Route 
            path="/reset-password/:token" 
            element={<ResetPasswordRedirect />} 
          />

          {/* Email Verification Route - processes verification and redirects to home */}
          <Route 
            path="/verify/:token" 
            element={<VerifyEmailRedirect />} 
          />

          {/* Email Verification Status Route - shows status modal */}
          <Route 
            path="/verify" 
            element={<VerifyEmailStatusRedirect />} 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

// Component to handle reset password redirect
const ResetPasswordRedirect = () => {
  const { token } = useParams();
  return <Navigate to={`/?token=${token}`} replace />;
};

// Component to handle email verification - calls API and redirects to home with status
const VerifyEmailRedirect = () => {
  const { token } = useParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify/${token}`);
        if (response.data.success) {
          // Redirect to home with success status
          window.location.href = `/?verify=success&message=${encodeURIComponent(response.data.message || 'Email verified successfully')}`;
        } else {
          // Redirect to home with error status
          window.location.href = `/?verify=error&message=${encodeURIComponent(response.data.message || 'Verification failed')}`;
        }
      } catch (error) {
        // Redirect to home with error status
        const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
        window.location.href = `/?verify=error&message=${encodeURIComponent(errorMessage)}`;
      }
    };

    if (token) {
      verifyEmail();
    } else {
      window.location.href = `/?verify=error&message=${encodeURIComponent('Verification token is required')}`;
    }
  }, [token]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      <p>Verifying your email...</p>
    </div>
  );
};

// Component to handle verification status redirect (from backend redirect)
const VerifyEmailStatusRedirect = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    if (status && message) {
      // Redirect to home with verification status
      window.location.href = `/?verify=${status}&message=${encodeURIComponent(message)}`;
    } else {
      window.location.href = '/';
    }
  }, [status, message]);

  return null;
};

// Single layout component that wraps ALL pages
const MainLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default App;