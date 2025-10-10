// src/services/api.js

import axios from 'axios';

// Base API URL - with fallback for different environments
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: false, // Set to true if using cookies
});

// Request interceptor - Automatically add token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Log request for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    }

    return config;
  },
  (error) => {
    // Log request error
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log response for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    // Log response error
    console.error('API Response Error:', error);

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const { status, data } = error.response;

      switch (status) {
        case 400:
          // Bad Request
          console.error('Bad Request:', data);
          break;

        case 401:
          // Unauthorized - Token expired or invalid
          // Only redirect if it's NOT a login request to avoid infinite loops
          if (error.config.url !== '/auth/login' && 
              error.config.url !== '/auth/register') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Use setTimeout to avoid React state updates during render
            setTimeout(() => {
              window.location.href = '/login?session_expired=true';
            }, 100);
          }
          break;

        case 403:
          // Forbidden - User doesn't have permission
          console.error('Forbidden:', data);
          break;

        case 404:
          // Not Found
          console.error('Endpoint not found:', error.config.url);
          break;

        case 409:
          // Conflict - Resource conflict
          console.error('Conflict:', data);
          break;

        case 422:
          // Unprocessable Entity - Validation errors
          console.error('Validation Error:', data);
          break;

        case 429:
          // Too Many Requests - Rate limiting
          console.error('Rate limit exceeded:', data);
          break;

        case 500:
          // Internal Server Error
          console.error('Server Error:', data);
          break;

        case 502:
          // Bad Gateway
          console.error('Bad Gateway:', data);
          break;

        case 503:
          // Service Unavailable
          console.error('Service Unavailable:', data);
          break;

        default:
          console.error(`HTTP Error ${status}:`, data);
      }

      // Return the error response data if available
      return Promise.reject(data || { message: `HTTP Error ${status}` });

    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error:', error.request);
      return Promise.reject({ 
        message: 'Network error. Please check your connection.' 
      });

    } else {
      // Something else happened while setting up the request
      console.error('Request Setup Error:', error.message);
      return Promise.reject({ 
        message: 'Request configuration error.' 
      });
    }
  }
);

// Add helper methods for common HTTP methods with enhanced functionality
const apiHelpers = {
  // GET request with caching control
  get: (url, params = {}, config = {}) => {
    return api.get(url, { params, ...config });
  },

  // POST request with different content types
  post: (url, data = {}, config = {}) => {
    return api.post(url, data, config);
  },

  // PUT request for full updates
  put: (url, data = {}, config = {}) => {
    return api.put(url, data, config);
  },

  // PATCH request for partial updates
  patch: (url, data = {}, config = {}) => {
    return api.patch(url, data, config);
  },

  // DELETE request
  delete: (url, config = {}) => {
    return api.delete(url, config);
  },

  // File upload with FormData
  upload: (url, formData, onUploadProgress = null) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  // Download file
  download: (url, params = {}) => {
    return api.get(url, {
      params,
      responseType: 'blob', // Important for file downloads
    });
  },
};

// Export both the default api instance and helper methods
export default api;
export { apiHelpers };
