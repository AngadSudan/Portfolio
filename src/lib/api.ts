import axios from "axios";

/**
 * Axios instance pre-configured with the admin Bearer token
 * from localStorage. Use this for all admin API calls.
 */
export const adminApi = axios.create({
  headers: {},
});

// Attach the token from localStorage on every request
adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, redirect to login (handles expired tokens gracefully)
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default adminApi;
