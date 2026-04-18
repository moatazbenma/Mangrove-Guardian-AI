import axios from "axios";
import { isTokenExpired, refreshAccessToken } from "./tokens";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://mangrove-guardian-ai.onrender.com/api"
    : "http://localhost:8000/api");

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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

    return Promise.reject(error);
  }
);

export default api;
