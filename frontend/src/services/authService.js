// src/services/authService.js
import api from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        // Save token and user data
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      // Extract error message from enhanced error object (from API interceptor)
      // The interceptor creates: { message, status, data, ... }
      const errorMessage = error.message || error.data?.message || error.response?.data?.message || 'Registration failed';
      const errorObj = {
        message: errorMessage,
        ...(error.data || error.response?.data || {})
      };
      throw errorObj;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      // Extract error message from enhanced error object (from API interceptor)
      // The interceptor creates: { message, status, data, ... }
      const errorMessage = error.message || error.data?.message || error.response?.data?.message || 'Login failed';
      const errorObj = {
        message: errorMessage,
        ...(error.data || error.response?.data || {})
      };
      throw errorObj;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset email' };
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/me');
      console.log('getCurrentUser response:', response);
      // Assuming your backend returns: { success: true, data: userObject }
      if (response.data && response.data.success) {
        return response.data;
      }
      // If backend returns user data directly without wrapper
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      // Return consistent error format
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch user profile'
      };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/me', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/me/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Delete account
  deleteAccount: async () => {
    try {
      const response = await api.delete('/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    try {
      const response = await api.post('/auth/resend-verification');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend verification email' };
    }
  },

  // Check if user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get stored user data from localStorage
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  },

  // Get authentication token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Set authentication token (useful for social logins etc.)
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Set user data
  setUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user has specific role (for future role-based features)
  hasRole: (role) => {
    const user = authService.getStoredUser();
    return user && user.roles && user.roles.includes(role);
  },

  // Refresh token (for future implementation)
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }
};

export default authService;