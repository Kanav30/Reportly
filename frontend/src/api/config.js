/**
 * API Configuration for Reportly Frontend
 * Configurable via Vite environment variable VITE_API_BASE_URL.
 * Falls back to http://localhost:8000 for local development.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  ASK: `${API_BASE_URL}/api/ask`,
  REPORTS: `${API_BASE_URL}/api/reports`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
};
