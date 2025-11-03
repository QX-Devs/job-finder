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
import ResumeDashboard from "./pages/ResumeDashboard";

function App() {
  return (
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
                <ResumeDashboard />
              </ProtectedRoute>
            } 
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
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