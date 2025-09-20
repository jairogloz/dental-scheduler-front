import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance
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
      // Get fresh session on every request
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Auth session error:', error.message);
        return config;
      }
      
      // Attach JWT token to Authorization header
      if (session?.access_token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${session.access_token}`;
  // ApiClient attaching access token to request
      } else {
        // Remove auth header if no token
        if (config.headers) {
          delete config.headers.Authorization;
        }
        console.warn('⚠️ No access token found in session');
      }
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration and refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
  // Token expired, attempting refresh
        
        // Attempt to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session?.access_token) {
          // Refresh failed - sign out and redirect to login
          console.error('❌ Session refresh failed:', refreshError?.message);
          await supabase.auth.signOut();
          
          // Only redirect if we're not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
        
  // Session refreshed successfully
        
        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        
        // Add a small delay to ensure token is properly propagated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry the original request
  // Retrying original request after token refresh
        return apiClient.request(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh error:', refreshError);
        await supabase.auth.signOut();
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    // Log other errors for debugging (but not auth errors to avoid spam)
    if (error.response?.status !== 401) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    
    return Promise.reject(error);
  }
);

// Legacy interface for backward compatibility
export const legacyApiClient = {
  async get<T>(endpoint: string): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await apiClient.get<T>(endpoint);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async post<T>(endpoint: string, data?: any): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await apiClient.post<T>(endpoint, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async put<T>(endpoint: string, data?: any): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await apiClient.put<T>(endpoint, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async delete<T>(endpoint: string): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await apiClient.delete<T>(endpoint);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
};

export default apiClient;
export { apiClient };
