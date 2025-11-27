// frontend/src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isVerifying, verifyAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only verify if we have a token but aren't authenticated yet
    // If already authenticated, skip verification
    const token = localStorage.getItem('token');
    
    if (!token) {
      // No token, not authenticated
      setIsChecking(false);
      return;
    }
    
    if (isAuthenticated) {
      // Already authenticated, no need to verify again
      setIsChecking(false);
      return;
    }

    // If we have a token but not authenticated, verify with server
    // This handles cases where the app was refreshed or token needs validation
    const checkAuth = async () => {
      setIsChecking(true);
      try {
        const result = await verifyAuth(true); // Silent verification
        // If verification failed, verifyAuth will handle clearing auth and redirect
        if (!result || !result.authenticated) {
          console.warn('Auth verification returned false');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        // Don't clear auth here - let verifyAuth handle it
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to allow state to settle after login
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 50);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Show loading state while checking authentication
  if (isLoading || isVerifying || isChecking) {
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
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // If not authenticated, redirect to home (which will show login modal)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render protected content
  return children;
};

export default ProtectedRoute;