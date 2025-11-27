// src/services/api.js

import axios from 'axios';
import { HTTP_STATUS, ERROR_MESSAGES } from './apiConstants';

// Base API URL - with fallback for different environments
// IMPORTANT: For LAN access, set REACT_APP_API_URL=http://192.168.1.100:5000/api in .env
function getApiUrl() {
  // First, check environment variable (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If running in browser, use current window location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If not localhost, use current hostname for API
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:5000/api`;
    }
  }
  
  // Fallback to localhost only if on localhost
  return 'http://localhost:5000/api';
}

// Get initial API URL
let API_URL = getApiUrl();

// Function to get current API URL (recalculates based on current window location)
export function getCurrentApiUrl() {
  return getApiUrl();
}

// Update API URL if window location changes (for dynamic updates)
if (typeof window !== 'undefined') {
  // Recalculate on every access to ensure it's current
  const updateApiUrl = () => {
    const newUrl = getApiUrl();
    if (newUrl !== API_URL) {
      console.log('🔄 API URL changed:', API_URL, '→', newUrl);
      API_URL = newUrl;
      api.defaults.baseURL = API_URL;
    }
  };
  
  // Update immediately
  updateApiUrl();
  
  // Log API URL for debugging
  console.log('🔗 API Base URL:', API_URL);
  console.log('🌐 Current hostname:', window.location.hostname);
  console.log('🌐 Current origin:', window.location.origin);
  console.log('🌐 Current protocol:', window.location.protocol);
  console.log('🌐 REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'not set');
  
  // Update on hashchange/popstate (SPA navigation)
  window.addEventListener('hashchange', updateApiUrl);
  window.addEventListener('popstate', updateApiUrl);
}

// Default retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryStatusCodes: [408, 429, 500, 502, 503, 504] // Status codes to retry
};

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout (increased from 10)
  withCredentials: false, // Set to true if using cookies
});

// Request interceptor - Automatically add token to all requests AND ensure correct baseURL
api.interceptors.request.use(
  (config) => {
    // Update baseURL to ensure it's always current (important for mobile/LAN access)
    const currentApiUrl = getApiUrl();
    if (config.baseURL !== currentApiUrl) {
      console.log('🔄 Updating API baseURL in request:', config.baseURL, '→', currentApiUrl);
      config.baseURL = currentApiUrl;
      api.defaults.baseURL = currentApiUrl; // Also update the default
    }
    
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

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    // Log request for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        fullUrl: `${config.baseURL}${config.url}`,
        headers: config.headers,
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    // Log request error
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally with retry logic
api.interceptors.response.use(
  (response) => {
    // Log response for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
    }

    return response;
  },
  async (error) => {
    // Log response error
    console.error('❌ API Response Error:', error);

    const originalRequest = error.config;

    // ✅ RETRY LOGIC FOR NETWORK ERRORS AND SPECIFIC STATUS CODES
    if (shouldRetry(error) && !originalRequest._retryCount) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < RETRY_CONFIG.maxRetries) {
        originalRequest._retryCount++;
        
        console.log(`🔄 Retrying request (${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries}): ${originalRequest.url}`);
        
        // Exponential backoff delay
        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, originalRequest._retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return api(originalRequest);
      }
    }

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const { status, data } = error.response;

      // Create enhanced error object
      const enhancedError = {
        message: data?.message || getErrorMessage(status),
        status,
        data: data || {},
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date().toISOString()
      };

      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          // 400 - Bad Request
          console.error('❌ Bad Request:', enhancedError);
          break;

        case HTTP_STATUS.UNAUTHORIZED:
          // 401 - Unauthorized - Token expired or invalid
          handleUnauthorizedError(error);
          break;

        case HTTP_STATUS.FORBIDDEN:
          // 403 - Forbidden - User doesn't have permission
          console.error('🚫 Forbidden:', enhancedError);
          break;

        case HTTP_STATUS.NOT_FOUND:
          // 404 - Not Found
          console.error('🔍 Endpoint not found:', error.config?.url);
          break;

        case HTTP_STATUS.CONFLICT:
          // 409 - Conflict - Resource conflict
          console.error('⚡ Conflict:', enhancedError);
          break;

        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          // 422 - Unprocessable Entity - Validation errors
          console.error('📝 Validation Error:', enhancedError);
          break;

        case HTTP_STATUS.TOO_MANY_REQUESTS:
          // 429 - Too Many Requests - Rate limiting
          console.error('🚦 Rate limit exceeded:', enhancedError);
          break;

        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          // 500 - Internal Server Error
          console.error('💥 Server Error:', enhancedError);
          break;

        case HTTP_STATUS.BAD_GATEWAY:
          // 502 - Bad Gateway
          console.error('🌐 Bad Gateway:', enhancedError);
          break;

        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          // 503 - Service Unavailable
          console.error('🔧 Service Unavailable:', enhancedError);
          break;

        default:
          console.error(`❓ HTTP Error ${status}:`, enhancedError);
      }

      // Return the enhanced error
      return Promise.reject(enhancedError);

    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('📡 Network Error:', {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        details: error.request
      });

      return Promise.reject({ 
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString()
      });

    } else {
      // Something else happened while setting up the request
      console.error('⚙️ Request Setup Error:', error.message);
      
      return Promise.reject({ 
        message: 'Request configuration error.',
        code: 'REQUEST_SETUP_ERROR',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Helper function to determine if request should be retried
function shouldRetry(error) {
  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on specific status codes
  const status = error.response?.status;
  return RETRY_CONFIG.retryStatusCodes.includes(status);
}

// Helper function to get user-friendly error messages
function getErrorMessage(status) {
  const messages = {
    [HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input.',
    [HTTP_STATUS.UNAUTHORIZED]: ERROR_MESSAGES.UNAUTHORIZED,
    [HTTP_STATUS.FORBIDDEN]: ERROR_MESSAGES.FORBIDDEN,
    [HTTP_STATUS.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
    [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down.',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: ERROR_MESSAGES.SERVER_ERROR,
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.'
  };

  return messages[status] || ERROR_MESSAGES.DEFAULT;
}

// Helper function to handle unauthorized errors
function handleUnauthorizedError(error) {
  // Only handle if it's NOT an auth request to avoid infinite loops
  const isAuthRequest = error.config?.url?.includes('/auth/');
  
  if (!isAuthRequest) {
    // Clear auth data immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch a custom event that AuthContext can listen to
    // This allows AuthContext to update state without direct coupling
    window.dispatchEvent(new CustomEvent('auth:logout', { 
      detail: { reason: 'invalid or expired token' } 
    }));
    
    // Use setTimeout to avoid React state updates during render
    setTimeout(() => {
      // Check if we're not already on a public page to avoid unnecessary redirects
      const publicPaths = ['/', '/about-us', '/contact-us', '/privacy-policy', 
                          '/terms-of-service', '/find-jobs', '/companies', 
                          '/career-advice', '/blog', '/faq', '/cookies', 
                          '/accessibility', '/cv-prompt', '/cv-generator'];
      
      const isPublicPath = publicPaths.some(path => 
        window.location.pathname === path || 
        window.location.pathname.startsWith('/verify') ||
        window.location.pathname.startsWith('/reset-password')
      );
      
      if (!isPublicPath) {
        // Redirect to home page (not login, since we don't have a /login route)
        window.location.href = '/';
      }
    }, 100);
  }
}

// Helper function to generate unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
  upload: (url, formData, onUploadProgress = null, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
      onUploadProgress,
    });
  },

  // Download file
  download: (url, params = {}, config = {}) => {
    return api.get(url, {
      ...config,
      params,
      responseType: 'blob', // Important for file downloads
    });
  },

  // Multiple concurrent requests
  all: (requests) => {
    return axios.all(requests);
  },

  // Spread multiple responses
  spread: (callback) => {
    return axios.spread(callback);
  }
};

// Utility functions for API
export const apiUtils = {
  // Check if error is a specific type
  isNetworkError: (error) => error.code === 'NETWORK_ERROR',
  isUnauthorized: (error) => error.status === HTTP_STATUS.UNAUTHORIZED,
  isServerError: (error) => error.status >= 500,
  
  // Extract validation errors from response
  getValidationErrors: (error) => {
    if (error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY && error.data.errors) {
      return error.data.errors;
    }
    return null;
  },
  
  // Create cancel token for request cancellation
  createCancelToken: () => {
    return axios.CancelToken.source();
  },
  
  // Check if error is due to cancellation
  isCancel: (error) => axios.isCancel(error),
  
  // Format error for display
  formatError: (error) => {
    if (typeof error === 'string') return error;
    return error.message || ERROR_MESSAGES.DEFAULT;
  }
};

// Configuration methods
export const apiConfig = {
  // Update base URL dynamically
  setBaseURL: (baseURL) => {
    api.defaults.baseURL = baseURL;
  },
  
  // Update default headers
  setHeader: (key, value) => {
    api.defaults.headers.common[key] = value;
  },
  
  // Remove header
  removeHeader: (key) => {
    delete api.defaults.headers.common[key];
  },
  
  // Set authentication token
  setToken: (token) => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  },
  
  // Get current configuration
  getConfig: () => {
    return {
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: { ...api.defaults.headers.common }
    };
  }
};

// Export both the default api instance and helper methods
export default api;
export { apiHelpers }
;