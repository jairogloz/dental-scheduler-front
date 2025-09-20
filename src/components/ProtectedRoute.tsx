import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  console.log("🔒 ProtectedRoute component rendered");

  const { user, loading, session, organizationId } = useAuth();

  // Add debugging logs
  console.log("🔒 ProtectedRoute state:", {
    hasUser: !!user,
    userId: user?.id,
    loading,
    hasSession: !!session,
    organizationId,
    userEmail: user?.email,
  });

  if (loading) {
    console.log(
      "🔒 ProtectedRoute showing loading spinner due to loading=true"
    );
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#64748b", margin: 0 }}>Cargando...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    console.log("🔒 ProtectedRoute redirecting to login due to no user");
    return <Navigate to="/login" replace />;
  }

  console.log(
    "🔒 ProtectedRoute rendering children - user authenticated successfully"
  );

  return <>{children}</>;
};

export default ProtectedRoute;
