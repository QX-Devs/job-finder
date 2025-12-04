// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Verify authentication status with server
   * This is the core function that checks if the user is actually logged in
   */
  const verifyAuth = useCallback(async (silent = false) => {
    // Don't verify if already verifying to prevent race conditions
    if (isVerifying) {
      // Return current auth state if already verifying
      return { authenticated: isAuthenticated, user };
    }

    const token = authService.getToken();
    
    // No token means not authenticated
    if (!token) {
      if (!silent) {
        setIsLoading(false);
      }
      setIsAuthenticated(false);
      setUser(null);
      authService.clearAuth();
      return { authenticated: false, user: null };
    }

    setIsVerifying(true);

    try {
      // Call the auth status endpoint to verify token with server
      const response = await api.get('/auth/status');
      
      if (response.data && response.data.authenticated && response.data.user) {
        // Token is valid and user exists - verify with full user data
        try {
          const fullUserResponse = await api.get('/me');
          if (fullUserResponse.data && fullUserResponse.data.success && fullUserResponse.data.data) {
            // User exists and we got full data
            setIsAuthenticated(true);
            setUser(fullUserResponse.data.data);
            authService.setUser(fullUserResponse.data.data);
            
            setIsVerifying(false);
            if (!silent) {
              setIsLoading(false);
            }
            return { authenticated: true, user: fullUserResponse.data.data };
          } else {
            // /me returned but user data is missing - user might be deleted
            throw new Error('User data not found');
          }
        } catch (err) {
          // If /me fails (404, 401, etc.), user doesn't exist - clear auth
          console.error('Failed to fetch user data - user may not exist:', err);
          throw new Error('User not found');
        }
      } else {
        // Server says not authenticated
        throw new Error('Not authenticated');
      }
    } catch (error) {
      // 401, 404, or any error means token is invalid or user doesn't exist
      console.error('Auth verification failed:', error);
      
      // Clear auth data immediately - user doesn't exist or token is invalid
      authService.clearAuth();
      setIsAuthenticated(false);
      setUser(null);
      setIsVerifying(false);
      
      if (!silent) {
        setIsLoading(false);
        
        // Redirect to home/login if not already there
        if (!location.pathname.includes('/login') && 
            !location.pathname.includes('/verify') && 
            !location.pathname.includes('/reset-password')) {
          // Don't redirect if we're on a public page
          const publicPaths = ['/', '/about-us', '/contact-us', '/privacy-policy', 
                              '/terms-of-service', '/companies', 
                              '/career-advice', '/blog', '/faq', '/cookies', 
                              '/accessibility', '/cv-prompt'];
          
          if (!publicPaths.includes(location.pathname)) {
            navigate('/', { replace: true });
          }
        }
      }
      
      return { authenticated: false, user: null };
    }
  }, [isVerifying, isAuthenticated, user, location.pathname, navigate]);

  /**
   * Login user and verify auth
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        // Immediately set auth state from login response (don't wait for verification)
        setIsAuthenticated(true);
        setUser(response.data);
        setIsLoading(false);
        
        // Verify auth in background (non-blocking)
        verifyAuth(true).catch(err => {
          console.warn('Background auth verification failed:', err);
        });
        
        return { success: true, data: response.data };
      }
      // If response exists but success is false, return the message
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      // Extract error message from error object
      const errorMessage = error.message || error.response?.data?.message || 'Login failed';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }, [verifyAuth]);

  /**
   * Register user and verify auth
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success && response.data) {
        // Immediately set auth state from registration response (don't wait for verification)
        setIsAuthenticated(true);
        setUser(response.data);
        setIsLoading(false);
        
        // Verify auth in background (non-blocking)
        verifyAuth(true).catch(err => {
          console.warn('Background auth verification failed:', err);
        });
        
        return { success: true, data: response.data };
      }
      // If response exists but success is false, return the message
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      // Extract error message from error object
      const errorMessage = error.message || error.response?.data?.message || 'Registration failed';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }, [verifyAuth]);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    authService.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);

  /**
   * Update user data
   */
  const updateUser = useCallback((userData) => {
    setUser(userData);
    authService.setUser(userData);
  }, []);

  // Verify auth on mount - always verify with server, never trust localStorage
  useEffect(() => {
    // Clear any stale data first, then verify
    const token = authService.getToken();
    if (!token) {
      // No token, clear everything immediately
      authService.clearAuth();
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    } else {
      // Have token, verify with server
      verifyAuth(false);
    }
  }, []); // Only run on mount

  // Verify auth on route changes (but not on every render)
  useEffect(() => {
    // Only verify if we think we're authenticated (have a token)
    // This prevents unnecessary API calls on public pages
    if (authService.getToken()) {
      verifyAuth(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Listen for storage changes (logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for auth logout events from API interceptor (401 responses)
  useEffect(() => {
    const handleAuthLogout = () => {
      // Clear auth state when API interceptor detects 401
      authService.clearAuth();
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isVerifying,
    verifyAuth,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

