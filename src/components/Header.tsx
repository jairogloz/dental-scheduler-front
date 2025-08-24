import { useAuth } from "../contexts/AuthContext";
import { getRoleDisplayText } from "../utils/roleUtils";

const Header = () => {
  const { user, userProfile, signOut, loadingProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 20px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "60px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "600",
              color: "#2c3e50",
            }}
          >
            Dental Scheduler
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              fontSize: "14px",
            }}
          >
            <span style={{ fontWeight: "500", color: "#374151" }}>
              {loadingProfile ? "..." : userProfile?.full_name || user?.email}
            </span>
            {userProfile?.roles && userProfile.roles.length > 0 ? (
              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                {getRoleDisplayText(userProfile)}
              </span>
            ) : (
              !loadingProfile && (
                <span
                  style={{
                    color: "#f59e0b",
                    fontSize: "12px",
                  }}
                >
                  Setup required
                </span>
              )
            )}
          </div>

          <button
            onClick={handleSignOut}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
