import { tokenManager } from './tokenManager';
import { supabase } from './supabase';

/**
 * Authentication debugging utilities
 * Use these functions in browser console or during development to diagnose auth issues
 */

// Decode JWT payload (without verification - for debugging only)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('❌ Error decoding JWT:', error);
    return null;
  }
}

// Check if token is expired (client-side check)
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const isExpired = currentTime >= expirationTime;
  
  console.log('🕐 Token expiration check:', {
    expirationTime: new Date(expirationTime).toISOString(),
    currentTime: new Date(currentTime).toISOString(),
    isExpired,
    timeUntilExpiry: isExpired ? 'EXPIRED' : `${Math.round((expirationTime - currentTime) / 1000 / 60)} minutes`
  });
  
  return isExpired;
}

// Comprehensive auth state diagnostics
export async function diagnoseAuthState(): Promise<void> {
  console.log('🔍 === AUTHENTICATION DIAGNOSTICS ===');
  
  try {
    // 1. Check Supabase session
    console.log('1️⃣ Checking Supabase session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Supabase session error:', sessionError);
    } else if (!session) {
      console.warn('⚠️ No Supabase session found');
    } else {
      console.log('✅ Supabase session found:', {
        userId: session.user?.id,
        email: session.user?.email,
        organizationId: session.user?.user_metadata?.organization_id,
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        refreshToken: session.refresh_token ? 'Present' : 'Missing'
      });
      
      // Check if session token is expired
      if (session.access_token) {
        console.log('🔍 Session token analysis:');
        const decoded = decodeJWT(session.access_token);
        console.log('📄 Token payload:', decoded);
        isTokenExpired(session.access_token);
      }
    }
    
    // 2. Check TokenManager state
    console.log('2️⃣ Checking TokenManager state...');
    const tokenInfo = tokenManager.getTokenInfo();
    console.log('📊 TokenManager info:', tokenInfo);
    
    // 3. Try to get a valid token
    console.log('3️⃣ Testing token acquisition...');
    const token = await tokenManager.getValidToken();
    
    if (token) {
      console.log('✅ TokenManager returned token (preview):', token.substring(0, 20) + '...');
      isTokenExpired(token);
    } else {
      console.error('❌ TokenManager returned null token');
    }
    
    // 4. Check localStorage
    console.log('4️⃣ Checking localStorage...');
    const storageKey = 'dental-scheduler-auth-token';
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('💾 localStorage session data:', {
          hasAccessToken: !!parsed.access_token,
          hasRefreshToken: !!parsed.refresh_token,
          expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toISOString() : 'N/A'
        });
      } catch (parseError) {
        console.error('❌ Error parsing localStorage data:', parseError);
      }
    } else {
      console.warn('⚠️ No session data in localStorage');
    }
    
    // 5. Test API call
    console.log('5️⃣ Testing API call...');
    try {
      const response = await fetch('/api/v1/organization?start_date=2025-01-01&end_date=2025-01-31', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API test result:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
      } else {
        console.log('✅ API call successful');
      }
    } catch (apiError) {
      console.error('❌ API call failed:', apiError);
    }
    
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  }
  
  console.log('🔍 === DIAGNOSTICS COMPLETE ===');
}

// Force token refresh for testing
export async function forceTokenRefresh(): Promise<void> {
  console.log('🔄 Forcing token refresh...');
  try {
    const newToken = await tokenManager.forceRefresh();
    if (newToken) {
      console.log('✅ Token refresh successful (preview):', newToken.substring(0, 20) + '...');
      isTokenExpired(newToken);
    } else {
      console.error('❌ Token refresh failed');
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
  }
}

// Clear all auth data for testing
export async function clearAllAuthData(): Promise<void> {
  console.log('🧹 Clearing all auth data...');
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage manually (just in case)
    localStorage.removeItem('dental-scheduler-auth-token');
    
    // Clear any other auth-related storage
    sessionStorage.clear();
    
    console.log('✅ All auth data cleared');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
}

// Make functions available in browser console during development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).authDebug = {
    diagnose: diagnoseAuthState,
    forceRefresh: forceTokenRefresh,
    clearAuth: clearAllAuthData,
    decodeToken: decodeJWT,
    isExpired: isTokenExpired
  };
  
  console.log('🛠️ Auth debugging tools available at window.authDebug');
  console.log('Available commands:');
  console.log('  - authDebug.diagnose() - Full auth state analysis');
  console.log('  - authDebug.forceRefresh() - Force token refresh');
  console.log('  - authDebug.clearAuth() - Clear all auth data');
  console.log('  - authDebug.decodeToken(token) - Decode JWT payload');
  console.log('  - authDebug.isExpired(token) - Check if token is expired');
}
