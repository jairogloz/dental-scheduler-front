import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

interface OrgResponse {
  data: any;
  error?: string;
}

export default function AuthTest() {
  const { session, signOut, user, organizationId, loading } = useAuth();
  const [responseText, setResponseText] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const callApi = async () => {
    if (!session) return;
    setApiLoading(true);
    try {
      const res = await fetch(
        "http://localhost:8080/api/v1/organization?start_date=2025-01-01&end_date=2025-12-31&limit=500",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const txt = await res.text();
      setResponseText(txt);
    } catch (err) {
      setResponseText("Error: " + String(err));
    }
    setApiLoading(false);
  };

  if (loading) {
    return <div>Loading auth state...</div>;
  }

  if (!session) {
    return <div>Not authenticated - please login</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>🔐 Auth Test Dashboard</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>User Info:</h3>
        <div>Email: {user?.email}</div>
        <div>Full Name: {user?.user_metadata?.full_name || "Not set"}</div>
        <div>Organization ID: {organizationId || "Not set"}</div>
        <div>User ID: {user?.id}</div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={signOut}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🚪 Sign Out
        </button>

        <button
          onClick={callApi}
          disabled={apiLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {apiLoading ? "🔄 Calling API..." : "📡 Test API Call"}
        </button>
      </div>

      {responseText && (
        <div style={{ marginTop: "20px" }}>
          <h3>API Response:</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              backgroundColor: "#f3f4f6",
              padding: "15px",
              borderRadius: "4px",
              fontSize: "12px",
              overflow: "auto",
              maxHeight: "400px",
            }}
          >
            {responseText}
          </pre>
        </div>
      )}
    </div>
  );
}
