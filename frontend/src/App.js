// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
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
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

// Single layout component that wraps ALL pages
const MainLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default App;