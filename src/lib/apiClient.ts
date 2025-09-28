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
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('🔐 Token attached to request');
      } else {
        // Remove auth header if no token
        if (config.headers) {
          delete config.headers.Authorization;
        }
        console.warn('⚠️ No access token available for request');
      }
      
      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor rejection:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.log(`❌ API Error: ${error.response?.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
    
    // Handle 401 Unauthorized errors (token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._authRetryAttempted) {
      originalRequest._authRetryAttempted = true;
      
      console.log('🔄 401 Unauthorized - attempting to refresh session...');
      
      try {
        // Refresh the session
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session?.access_token) {
          console.error('❌ Session refresh failed');
          await handleAuthFailure();
          return Promise.reject(error);
        }
        
        // Update the original request with the new token
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any;
        }
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        
        console.log('🔄 Retrying original request with refreshed token...');
        return apiClient.request(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        await handleAuthFailure();
        return Promise.reject(error);
      }
    }
    
    // Handle other 4xx/5xx errors
    if (error.response?.status >= 400) {
      console.error('❌ API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: originalRequest?.url,
        method: originalRequest?.method
      });
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle authentication failures
async function handleAuthFailure(): Promise<void> {
  console.log('🚪 Handling auth failure - signing out...');
  
  try {
    await supabase.auth.signOut();
  } catch (signOutError) {
    console.error('❌ Error during sign out:', signOutError);
  }
  
  // Redirect to login if not already there
  if (!window.location.pathname.includes('/login')) {
    console.log('🔄 Redirecting to login page...');
    window.location.href = '/login';
  }
}

// Export the configured axios instance
export { apiClient };
export default apiClient;