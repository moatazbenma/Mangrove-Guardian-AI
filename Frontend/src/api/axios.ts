import axios from "axios";
import { isTokenExpired, refreshAccessToken } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

// Request interceptor to add token and refresh if needed
api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem("access");
  
  // Check if token is expired or about to expire (within 1 minute)
  if (token && isTokenExpired(token)) {
    // Try to refresh the token before making the request
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Refresh failed, redirect to login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return Promise.reject(new Error("Token refresh failed"));
    }
    token = localStorage.getItem("access");
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || '60';
      const errorMessage = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      
      // Attach custom message to error for components to display
      error.message = errorMessage;
      
      // Show notification
      const event = new CustomEvent('errorNotification', {
        detail: { 
          message: errorMessage, 
          type: 'rateLimited',
          retryAfter: parseInt(retryAfter),
          status: 429
        }
      });
      window.dispatchEvent(event);
      
      return Promise.reject(error);
    }

    // If error is 401 (Unauthorized) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Get new token and retry the request
        const newToken = localStorage.getItem("access");
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // Dispatch general error events for other status codes
    if (error.response?.status && error.response?.status !== 401) {
      const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
      const event = new CustomEvent('errorNotification', {
        detail: {
          message: detail || `Error: ${error.response?.status}`,
          type: 'error',
          status: error.response?.status
        }
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

export default api;