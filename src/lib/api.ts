// api.ts - Fixed Axios instance with improved token handling
import axios, { AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://mheback.onrender.com/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// RESPONSE INTERCEPTOR – Refresh token on 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const refresh = Cookies.get("refresh_token");
    const isRemembered = Cookies.get("remember_me") === "true";

    const refreshTokenUrl = "/token/refresh/";

    // If refresh fails, redirect to login and don't retry
    if (originalRequest.url === refreshTokenUrl) {
      clearAllTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry && refresh) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}${refreshTokenUrl}`,
          { refresh },
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.access;
        const newRefreshToken = refreshResponse.data?.refresh; // Some backends return new refresh token

        if (newAccessToken) {
          // Set token expiry based on remember me preference
          const tokenExpiry = isRemembered ? 7 : undefined; // 7 days or session

          Cookies.set("access_token", newAccessToken, {
            expires: tokenExpiry,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            path: "/",
          });

          // Update refresh token if provided
          if (newRefreshToken) {
            Cookies.set("refresh_token", newRefreshToken, {
              expires: isRemembered ? 7 : undefined,
              secure: process.env.NODE_ENV === "production",
              sameSite: "Lax",
              path: "/",
            });
          }

          // Update request and retry
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        clearAllTokens();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions
const clearAllTokens = () => {
  Cookies.remove("access_token", { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
  Cookies.remove("user_role", { path: "/" });
  Cookies.remove("remember_me", { path: "/" });

  // Clear from localStorage as fallback
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
  }
};

const redirectToLogin = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

export default api;
