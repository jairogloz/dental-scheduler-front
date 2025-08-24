import { supabase } from '../lib/supabase'

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      return { data, error: null }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      return { data: null, error: error as Error }
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<{ data: T | null; error: Error | null }> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: Error | null }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: Error | null }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<{ data: T | null; error: Error | null }> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Helper function to handle API responses consistently
export const handleApiResponse = <T>(response: { data: T | null; error: Error | null }) => {
  if (response.error) {
    throw response.error
  }
  return response.data
}
