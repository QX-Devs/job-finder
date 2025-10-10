// App.js - Updated structure
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout'; // Assuming Layout is in the components folder
import Home from './pages/Home';
import Login from './pages/Login';
import SignUP from './pages/SignUP';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUS';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Layout */}
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          {/* Add more public pages here */}
        </Route>

        {/* Auth Routes (without Layout if you don't want the navbar/footer on login/signup) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUP />} />
        
        {/* Example Protected Route (using a nested structure) */}
        <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            {/* Add more protected pages here */}
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Helper component to integrate the existing Layout.js structure with Outlet
const LayoutWrapper = () => (
    <Layout>
      <main className="main-content"> {/* Wrap content in main-content for styling from Layout.css */}
        <Outlet /> 
      </main>
    </Layout>
);

export default App;