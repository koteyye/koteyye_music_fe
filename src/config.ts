// Centralized configuration

// Get API URL from environment variables or fallback to localhost
const rawApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Ensure it ends with /api
export const API_BASE_URL = rawApiUrl.endsWith('/api') 
    ? rawApiUrl 
    : rawApiUrl.endsWith('/') 
        ? `${rawApiUrl}api` 
        : `${rawApiUrl}/api`;

// Base URL for the application (useful for constructing absolute links)
export const APP_BASE_URL = window.location.origin;

export const config = {
    apiBaseUrl: API_BASE_URL,
    appBaseUrl: APP_BASE_URL
};

export default config;
