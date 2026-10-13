/**
 * API Configuration for Reportly Frontend
 * - When running in production on Render (or any external domain), connects to the Render backend.
 * - When running locally on localhost/127.0.0.1, connects to http://localhost:8000.
 * - Can be explicitly overridden with Vite environment variable VITE_API_BASE_URL.
 */

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // Check if browser is running on non-localhost domain (e.g. Render)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.localhost');

    if (!isLocalhost) {
      // In production/cloud deployment, never fallback to localhost (avoids Mixed Content & connection errors)
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl.replace(/\/+$/, '');
      }
      return 'https://reportly-backend-9xug.onrender.com';
    }
  }

  // Local development default
  return (envUrl || 'http://localhost:8000').replace(/\/+$/, '');
};

export const API_BASE_URL = resolveApiBaseUrl();

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  ASK: `${API_BASE_URL}/api/ask`,
  REPORTS: `${API_BASE_URL}/api/reports`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
};
