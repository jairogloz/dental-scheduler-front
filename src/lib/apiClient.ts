import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - attach auth token to every request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        // Remove auth header if no token
        if (config.headers) {
          delete config.headers.Authorization;
        }
      }
      
      return config;
    } catch (_error) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._authRetryAttempted) {
      originalRequest._authRetryAttempted = true;

      try {
        // Refresh the session
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session?.access_token) {
          await handleAuthFailure();
          return Promise.reject(error);
        }
        
        // Update the original request with the new token
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any;
        }
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return apiClient.request(originalRequest);
        
      } catch (_refreshError) {
        await handleAuthFailure();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle authentication failures
async function handleAuthFailure(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (_signOutError) {
    // Best effort sign-out; suppress errors to avoid masking original failure
  }
  
  // Redirect to login if not already there
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

// Export the configured axios instance
export { apiClient };
export default apiClient;