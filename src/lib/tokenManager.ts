import { supabase } from './supabase';

// Centralized token management with proper concurrency control
class TokenManager {
  private token: string | null = null;
  private expiresAt: number = 0;
  private refreshPromise: Promise<string | null> | null = null;
  private isRefreshing = false;

  // Get a valid token with proper concurrency control
  async getValidToken(): Promise<string | null> {
    const now = Date.now();
    
    // Return cached token if still valid (with 2-minute buffer)
    if (this.token && this.expiresAt > now + 2 * 60 * 1000) {
      console.log('🎯 Using cached token (expires in', Math.round((this.expiresAt - now) / 1000 / 60), 'minutes)');
      return this.token;
    }

    // If already refreshing, wait for it
    if (this.refreshPromise) {
      console.log('⏳ Waiting for ongoing token refresh...');
      return this.refreshPromise;
    }

    // Start fresh token acquisition
    this.refreshPromise = this.acquireToken();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Private method to acquire token from Supabase
  private async acquireToken(): Promise<string | null> {
    try {
      console.log('🔄 Acquiring fresh token from Supabase...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        this.clearToken();
        return null;
      }

      if (!session?.access_token) {
        console.warn('⚠️ No session or access token available');
        this.clearToken();
        return null;
      }

      // Validate token expiration
      const now = Date.now();
      const expiresAt = session.expires_at ? session.expires_at * 1000 : now + 60 * 60 * 1000;
      
      if (expiresAt <= now) {
        console.warn('⚠️ Retrieved token is already expired, attempting refresh...');
        return this.refreshToken();
      }

      // Cache the valid token
      this.token = session.access_token;
      this.expiresAt = expiresAt;
      
      console.log('✅ Token acquired successfully (expires in', Math.round((expiresAt - now) / 1000 / 60), 'minutes)');
      console.log('🔑 Token preview:', session.access_token.substring(0, 20) + '...');
      
      return this.token;
      
    } catch (error) {
      console.error('❌ Error acquiring token:', error);
      this.clearToken();
      return null;
    }
  }

  // Refresh token using Supabase's refresh mechanism
  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      console.log('⏳ Token refresh already in progress...');
      // Wait a bit and try to get the refreshed token
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.token;
    }

    try {
      this.isRefreshing = true;
      console.log('🔄 Refreshing expired token...');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session?.access_token) {
        console.error('❌ Token refresh failed:', error?.message);
        this.clearToken();
        return null;
      }

      // Cache the refreshed token
      const now = Date.now();
      const expiresAt = session.expires_at ? session.expires_at * 1000 : now + 60 * 60 * 1000;
      
      this.token = session.access_token;
      this.expiresAt = expiresAt;
      
      console.log('✅ Token refreshed successfully');
      console.log('🔑 New token preview:', session.access_token.substring(0, 20) + '...');
      
      return this.token;
      
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      this.clearToken();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Clear token cache and sign out
  async signOut(): Promise<void> {
    console.log('🚪 Signing out and clearing token cache...');
    this.clearToken();
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Error during sign out:', error);
    }
  }

  // Clear internal token cache
  private clearToken(): void {
    this.token = null;
    this.expiresAt = 0;
    this.refreshPromise = null;
    this.isRefreshing = false;
  }

  // Force refresh (useful for testing or manual refresh)
  async forceRefresh(): Promise<string | null> {
    console.log('🔄 Force refreshing token...');
    this.clearToken();
    return this.getValidToken();
  }

  // Get token info for debugging
  getTokenInfo(): { hasToken: boolean; expiresAt: number; isExpired: boolean } {
    const now = Date.now();
    return {
      hasToken: !!this.token,
      expiresAt: this.expiresAt,
      isExpired: this.expiresAt <= now
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
