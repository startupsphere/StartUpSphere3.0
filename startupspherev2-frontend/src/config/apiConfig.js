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
