// api.ts - Replace your existing api.ts content with this (focus on interceptor)

import axios, { AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.mhebazar.com/api";

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
    // CWV FIX: Forcing all production requests originating from this axios instance to HTTPS.
    if (process.env.NODE_ENV === "production") {
        if (config.url?.startsWith('http://')) {
            config.url = config.url.replace('http://', 'https://');
        } else if (config.baseURL?.startsWith('http://')) {
            config.baseURL = config.baseURL.replace('http://', 'https://');
        }
    }
    
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
        // ... (rest of the refresh logic remains the same)
        const newAccessToken = refreshResponse.data?.access;
        const newRefreshToken = refreshResponse.data?.refresh; 

        if (newAccessToken) {
          const tokenExpiry = isRemembered ? 7 : undefined;

          Cookies.set("access_token", newAccessToken, {
            expires: tokenExpiry,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            path: "/",
          });

          if (newRefreshToken) {
            Cookies.set("refresh_token", newRefreshToken, {
              expires: isRemembered ? 7 : undefined,
              secure: process.env.NODE_ENV === "production",
              sameSite: "Lax",
              path: "/",
            });
          }

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

// Helper functions (keep these as they are)
const clearAllTokens = () => {
  Cookies.remove("access_token", { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
  Cookies.remove("user_role", { path: "/" });
  Cookies.remove("remember_me", { path: "/" });

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