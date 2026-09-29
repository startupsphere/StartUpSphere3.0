/**
 * Centralized API configuration helper for StartUpSphere frontend.
 * Resolves and sanitizes the backend URL.
 */
export const getBackendUrl = () => {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL;

  if (!envUrl || envUrl.trim() === "" || envUrl === "undefined") {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      return "https://startupsphere30-production.up.railway.app";
    }
    return "http://localhost:8080";
  }
  // Strip trailing slash if present
  return envUrl.replace(/\/+$/, "");
};

/**
 * Helper to retrieve common headers including Bearer token if user is logged in.
 * Safely checks localStorage for 'token' and avoids setting 'undefined' or 'null' tokens.
 */
export const getAuthHeaders = (extraHeaders = {}) => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { ...extraHeaders };
  if (token && token !== "null" && token !== "undefined" && token.trim() !== "") {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Wrapper around fetch that automatically includes Authorization header and credentials: "include".
 */
export const authFetch = async (url, options = {}) => {
  const headers = getAuthHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  });
};
