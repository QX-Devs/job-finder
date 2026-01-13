import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useParams,
  useSearchParams,
} from "react-router-dom";
import usePageTitle from "./hooks/usePageTitle";
import api, { getCurrentApiUrl } from "./services/api";
import "./components/AuthModal.css";
import { LanguageProvider } from "./context/LanguageContext"; // <<< أضف هذا
import { AuthProvider } from "./context/AuthContext";
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
import Companies from "./pages/Companies";
import CareerAdvice from "./pages/CareerAdvice";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Cookies from "./pages/Cookies";
import Accessibility from "./pages/Accessibility";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import SavedJobs from "./pages/SavedJobs";

function App() {
  return (
    <LanguageProvider> {/* <<< لف كل التطبيق بالـ LanguageProvider */}
      <Router>
        <AuthProvider> {/* Global authentication provider - must be inside Router */}
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
            <Route 
              path="/cv-generator" 
              element={
                <ProtectedRoute>
                  <CVGenerator />
                </ProtectedRoute>
              } 
            />
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
        </AuthProvider>
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

  useEffect(() => {
    const verifyEmail = async () => {
      // Get the current API base URL (recalculates to ensure it's correct)
      let apiBaseUrl = getCurrentApiUrl();
      
      // Double-check: if still localhost but we're on a different hostname, force update
      if (apiBaseUrl.includes('localhost') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:5000/api`;
        console.warn('⚠️ Forced API URL update from localhost to:', apiBaseUrl);
        // Update the axios instance
        api.defaults.baseURL = apiBaseUrl;
      }
      const fullUrl = `${apiBaseUrl}/auth/verify/${token}`;
      
      console.log('📧 Verifying email:', {
        token: token ? `${token.substring(0, 20)}...` : 'missing',
        apiBaseUrl,
        fullUrl,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        origin: window.location.origin,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'not set',
        'api.defaults.baseURL': api.defaults.baseURL || 'not set'
      });
      
      // Ensure api instance is using the correct base URL
      if (api.defaults.baseURL !== apiBaseUrl) {
        console.warn('⚠️ API base URL mismatch, updating:', api.defaults.baseURL, '→', apiBaseUrl);
        api.defaults.baseURL = apiBaseUrl;
      }
      
      // Test if server is reachable first
      try {
        const healthUrl = `${apiBaseUrl.replace('/api', '')}/api/health`;
        console.log('🏥 Testing server connectivity:', healthUrl);
        const healthCheck = await fetch(healthUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json'
          }
        });
        console.log('🏥 Health check response:', {
          status: healthCheck.status,
          ok: healthCheck.ok,
          url: healthCheck.url,
          statusText: healthCheck.statusText
        });
        if (!healthCheck.ok) {
          throw new Error(`Health check failed: ${healthCheck.status} ${healthCheck.statusText}`);
        }
      } catch (healthError) {
        console.error('❌ Health check failed:', healthError);
        throw new Error(`Cannot reach server at ${apiBaseUrl}. Please ensure the backend server is running and accessible from your device.`);
      }

      try {
        const response = await api.get(`/auth/verify/${token}`);
        console.log('✅ Verification response:', response.data);
        
        if (response.data.success) {
          // Redirect to home with success status
          window.location.href = `/?verify=success&message=${encodeURIComponent(response.data.message || 'Email verified successfully')}`;
        } else {
          // Redirect to home with error status
          const errorMsg = response.data.message || 'Verification failed';
          console.error('❌ Verification failed:', errorMsg);
          window.location.href = `/?verify=error&message=${encodeURIComponent(errorMsg)}`;
        }
      } catch (error) {
        // Extract detailed error message
        const errorResponse = error.response?.data;
        const errorMessage = errorResponse?.message || error.message || 'Verification failed';
        const errorCode = errorResponse?.error || 'UNKNOWN_ERROR';
        
        // Check if it's a network error (no response from server)
        const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED' || error.request);
        
        console.error('❌ Verification error:', {
          message: errorMessage,
          error: errorCode,
          status: error.response?.status,
          code: error.code,
          fullUrl,
          apiBaseUrl,
          isNetworkError,
          details: errorResponse,
          request: error.request ? 'Request made but no response' : 'No request made'
        });
        
        // Show specific error message based on error code
        let userFriendlyMessage = errorMessage;
        
        if (isNetworkError) {
          // Network error - server not reachable
          userFriendlyMessage = `Cannot connect to server at ${apiBaseUrl}. Please ensure:
1. The backend server is running on port 5000
2. Your phone and PC are on the same network
3. Firewall allows connections on port 5000
4. Try accessing: ${apiBaseUrl.replace('/api', '/health')} in your browser`;
        } else if (errorCode === 'TOKEN_EXPIRED') {
          userFriendlyMessage = 'Verification link has expired. Please request a new verification email.';
        } else if (errorCode === 'TOKEN_INVALID') {
          userFriendlyMessage = 'Invalid verification link. Please check your email and try again.';
        } else if (errorCode === 'USER_NOT_FOUND') {
          userFriendlyMessage = 'User account not found. The account may have been deleted.';
        } else if (errorCode === 'DATABASE_ERROR') {
          userFriendlyMessage = 'Database connection error. Please try again later.';
        } else if (error.response?.status === 400 && errorMessage.includes('expired')) {
          userFriendlyMessage = 'Verification link has expired. Please request a new verification email.';
        } else if (error.response?.status === 400 && errorMessage.includes('invalid')) {
          userFriendlyMessage = 'Invalid verification link. Please check your email and try again.';
        } else if (error.response?.status === 404) {
          userFriendlyMessage = 'User account not found. The account may have been deleted.';
        } else if (error.response?.status === 500) {
          userFriendlyMessage = 'Server error during verification. Please try again later.';
        } else if (errorMessage === 'Network error. Please check your internet connection.') {
          // This is the generic network error from API interceptor
          userFriendlyMessage = `Cannot connect to server at ${apiBaseUrl}. Please check:
1. Backend server is running
2. Correct IP address (${window.location.hostname})
3. Firewall settings
4. Network connectivity`;
        }
        
        window.location.href = `/?verify=error&message=${encodeURIComponent(userFriendlyMessage)}`;
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
  // Automatically update page title based on current route
  usePageTitle();
  
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default App;