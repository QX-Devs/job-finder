import api from './api';

const AUTH_PREFIX = '/api/auth';
const USER_PREFIX = '/api/me';

const authService = {
  /* =========================
     Register
  ========================= */
  register: async (userData) => {
    try {
      const response = await api.post(`${AUTH_PREFIX}/register`, userData);

      if (response.data?.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }

      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Registration failed');
    }
  },

  /* =========================
     Login
  ========================= */
  login: async (email, password) => {
    try {
      const response = await api.post(`${AUTH_PREFIX}/login`, { email, password });

      if (response.data?.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }

      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Login failed');
    }
  },

  /* =========================
     Forgot Password
  ========================= */
  forgotPassword: async (email) => {
    try {
      const response = await api.post(`${AUTH_PREFIX}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to send reset email');
    }
  },

  /* =========================
     Reset Password
  ========================= */
  resetPassword: async (token, password) => {
    try {
      const response = await api.post(
        `${AUTH_PREFIX}/reset-password/${token}`,
        { password }
      );
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to reset password');
    }
  },

  /* =========================
     Resend Verification
  ========================= */
  resendVerificationEmail: async () => {
    try {
      const response = await api.post(`${AUTH_PREFIX}/resend-verification`);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to resend verification email');
    }
  },

  /* =========================
     Refresh Token
  ========================= */
  refreshToken: async () => {
    try {
      const response = await api.post(`${AUTH_PREFIX}/refresh-token`);

      if (response.data?.success) {
        localStorage.setItem('token', response.data.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  /* =========================
     User Profile
  ========================= */
  getCurrentUser: async () => {
    try {
      const response = await api.get(USER_PREFIX);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch user profile'
      };
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put(USER_PREFIX, userData);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to update profile');
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post(
        `${USER_PREFIX}/change-password`,
        { currentPassword, newPassword }
      );
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to change password');
    }
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete(USER_PREFIX);
      return response.data;
    } catch (error) {
      throw normalizeError(error, 'Failed to delete account');
    }
  },

  /* =========================
     Auth Utilities
  ========================= */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  setUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  hasRole: (role) => {
    const user = authService.getStoredUser();
    return !!(user && user.roles?.includes(role));
  }
};

/* =========================
   Helper: Normalize Errors
========================= */
function normalizeError(error, fallbackMessage) {
  return {
    message:
      error.response?.data?.message ||
      error.message ||
      fallbackMessage,
    ...(error.response?.data || {})
  };
}

export default authService;
