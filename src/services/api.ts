import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor: inject token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("safeserve_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle session invalidation gracefully without abruptly hijacking page navigation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear storage if the session validation endpoint explicitly fails
      if (error.config?.url?.includes("/auth/me")) {
        localStorage.removeItem("safeserve_token");
        localStorage.removeItem("safeserve_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
