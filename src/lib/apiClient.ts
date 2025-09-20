import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Token cache to avoid repeated session calls
let tokenCache: {
  token: string | null;
  expiresAt: number;
} = {
  token: null,
  expiresAt: 0
};

// Refresh promise to prevent concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

// Helper to get cached or fresh token
const getValidToken = async (): Promise<string | null> => {
  const now = Date.now();
  
  // Return cached token if still valid (with 5-minute buffer before expiry)
  if (tokenCache.token && tokenCache.expiresAt > now + 5 * 60 * 1000) {
    return tokenCache.token;
  }
  
  // Prevent concurrent refresh attempts
  if (refreshPromise) {
    return refreshPromise;
  }
  
  refreshPromise = (async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        console.warn('No valid session found:', error?.message);
        tokenCache = { token: null, expiresAt: 0 };
        return null;
      }
      
      // Cache the token with expiration info
      const expiresAt = session.expires_at ? session.expires_at * 1000 : now + 60 * 60 * 1000;
      tokenCache = {
        token: session.access_token,
        expiresAt
      };
      
      return session.access_token;
    } catch (error) {
      console.error('Error getting token:', error);
      tokenCache = { token: null, expiresAt: 0 };
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
};

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
      const token = await getValidToken();
      
      if (token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Remove auth header if no token
        if (config.headers) {
          delete config.headers.Authorization;
        }
        console.warn('⚠️ No access token available');
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
        console.log('🔄 Token expired, attempting refresh...');
        
        // Clear cached token first
        tokenCache = { token: null, expiresAt: 0 };
        
        // Attempt to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session?.access_token) {
          // Refresh failed - sign out and redirect to login
          console.error('❌ Session refresh failed:', refreshError?.message);
          
          // Clear any stored auth data
          tokenCache = { token: null, expiresAt: 0 };
          
          await supabase.auth.signOut();
          
          // Only redirect if we're not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
        
        console.log('✅ Session refreshed successfully');
        
        // Update token cache with new token
        const now = Date.now();
        const expiresAt = session.expires_at ? session.expires_at * 1000 : now + 60 * 60 * 1000;
        tokenCache = {
          token: session.access_token,
          expiresAt
        };
        
        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        
        // Retry the original request
        console.log('🔄 Retrying original request with new token');
        return apiClient.request(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh error:', refreshError);
        
        // Clear token cache and sign out
        tokenCache = { token: null, expiresAt: 0 };
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

// Function to clear token cache (call this on sign out)
export const clearTokenCache = () => {
  tokenCache = { token: null, expiresAt: 0 };
  refreshPromise = null;
};

export default apiClient;
export { apiClient };
