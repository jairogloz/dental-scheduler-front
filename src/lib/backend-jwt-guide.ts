/**
 * BACKEND GO JWT VALIDATION GUIDE
 * 
 * This file contains suggested improvements for the Go backend JWT validation
 * to work seamlessly with the refactored frontend token management.
 */

// SUGGESTED GO BACKEND MIDDLEWARE FOR JWT VALIDATION
/*

package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserContextKey contextKey = "user"

type JWTClaims struct {
	Sub          string                 `json:"sub"`
	Email        string                 `json:"email"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	Role         string                 `json:"role"`
	Aud          string                 `json:"aud"`
	Iss          string                 `json:"iss"`
	jwt.RegisteredClaims
}

type User struct {
	ID             string `json:"id"`
	Email          string `json:"email"`
	OrganizationID string `json:"organization_id"`
	Role           string `json:"role"`
}

// Enhanced JWT validation middleware with robust error handling
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Printf("❌ Missing Authorization header for %s %s", r.Method, r.URL.Path)
			http.Error(w, `{"error": {"message": "Missing authorization header"}, "success": false}`, http.StatusUnauthorized)
			return
		}

		// Validate Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Printf("❌ Invalid Authorization header format for %s %s", r.Method, r.URL.Path)
			http.Error(w, `{"error": {"message": "Invalid authorization header format"}, "success": false}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		
		// Log token validation attempt (without exposing the full token)
		tokenPreview := ""
		if len(tokenString) > 20 {
			tokenPreview = tokenString[:20] + "..."
		}
		log.Printf("🔐 Validating JWT token: %s for %s %s", tokenPreview, r.Method, r.URL.Path)

		// Parse and validate JWT token
		user, err := validateJWTToken(tokenString)
		if err != nil {
			log.Printf("❌ JWT validation failed: %v for %s %s", err, r.Method, r.URL.Path)
			
			// Return appropriate error based on validation failure type
			if strings.Contains(err.Error(), "expired") {
				http.Error(w, `{"error": {"message": "Token expired"}, "success": false}`, http.StatusUnauthorized)
			} else if strings.Contains(err.Error(), "invalid") {
				http.Error(w, `{"error": {"message": "Invalid token"}, "success": false}`, http.StatusUnauthorized)
			} else {
				http.Error(w, `{"error": {"message": "Token validation failed"}, "success": false}`, http.StatusUnauthorized)
			}
			return
		}

		log.Printf("✅ JWT validation successful for user %s (org: %s) - %s %s", 
			user.Email, user.OrganizationID, r.Method, r.URL.Path)

		// Add user to request context
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Robust JWT token validation with support for both legacy and new signing methods
func validateJWTToken(tokenString string) (*User, error) {
	// Get Supabase JWT secret from environment
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("SUPABASE_JWT_SECRET not configured")
	}

	// Parse token with claims
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Validate token and extract claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Validate token expiration manually for better error messages
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, fmt.Errorf("token expired at %v", claims.ExpiresAt.Time)
	}

	// Validate issuer (adjust URL based on your Supabase project)
	expectedIssuer := os.Getenv("SUPABASE_URL") + "/auth/v1"
	if claims.Iss != expectedIssuer {
		return nil, fmt.Errorf("invalid token issuer: %s", claims.Iss)
	}

	// Extract organization ID from user metadata
	organizationID := ""
	if claims.UserMetadata != nil {
		if orgID, exists := claims.UserMetadata["organization_id"]; exists {
			if orgIDStr, ok := orgID.(string); ok {
				organizationID = orgIDStr
			}
		}
	}

	// Validate that organization ID exists
	if organizationID == "" {
		return nil, fmt.Errorf("missing organization_id in user metadata")
	}

	// Create user object
	user := &User{
		ID:             claims.Sub,
		Email:          claims.Email,
		OrganizationID: organizationID,
		Role:           claims.Role,
	}

	return user, nil
}

// Helper function to get user from request context
func GetUserFromContext(ctx context.Context) (*User, bool) {
	user, ok := ctx.Value(UserContextKey).(*User)
	return user, ok
}

// Middleware to ensure user belongs to specific organization (optional additional security)
func RequireOrganization(requiredOrgID string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := GetUserFromContext(r.Context())
			if !ok {
				http.Error(w, `{"error": {"message": "User not found in context"}, "success": false}`, http.StatusUnauthorized)
				return
			}

			if user.OrganizationID != requiredOrgID {
				log.Printf("❌ Organization mismatch: user %s belongs to %s, required %s", 
					user.Email, user.OrganizationID, requiredOrgID)
				http.Error(w, `{"error": {"message": "Organization access denied"}, "success": false}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

*/

// ENVIRONMENT VARIABLES NEEDED IN GO BACKEND:
/*
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-from-settings
SUPABASE_URL=https://your-project-id.supabase.co
*/

// EXAMPLE USAGE IN GO ROUTES:
/*
func main() {
	router := mux.NewRouter()
	
	// Apply JWT middleware to protected routes
	api := router.PathPrefix("/api/v1").Subrouter()
	api.Use(middleware.JWTMiddleware)
	
	// Organization-specific routes
	api.HandleFunc("/organization", getOrganizationHandler).Methods("GET")
	api.HandleFunc("/appointments", getAppointmentsHandler).Methods("GET")
	api.HandleFunc("/appointments", createAppointmentHandler).Methods("POST")
	api.HandleFunc("/appointments/{id}", updateAppointmentHandler).Methods("PATCH")
	api.HandleFunc("/appointments/{id}/cancel", cancelAppointmentHandler).Methods("DELETE")
	
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}

func getOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": {"message": "User not found"}, "success": false}`, http.StatusInternalServerError)
		return
	}
	
	log.Printf("📊 Fetching organization data for user %s (org: %s)", user.Email, user.OrganizationID)
	
	// Your organization fetching logic here
	// Use user.OrganizationID to filter data
}
*/

export {}; // Make this a module
