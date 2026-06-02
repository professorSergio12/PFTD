import axios from "axios";

/**
 * Pre-configured axios instance.
 * - baseURL "/api" is proxied to the backend by Vite in dev (see vite.config.js)
 *   and can be pointed at the deployed API via VITE_API_URL in production.
 * - withCredentials lets the httpOnly auth cookie flow.
 * - A request interceptor also attaches the bearer token if we stored one.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages so components can show err.message directly.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;