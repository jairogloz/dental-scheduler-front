import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Component that detects invitation and password recovery links and redirects accordingly
 * - Invitation links come from Supabase with #access_token=...&type=invite
 * - Password recovery links come with #access_token=...&type=recovery
 */
const InvitationHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if URL hash contains authentication parameters
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const type = hashParams.get("type");

    // If this is an invitation link, redirect to signup page
    if (type === "invite") {
      // Preserve the hash parameters for SignupPage to read
      navigate(`/signup${location.hash}`, { replace: true });
    }
    // If this is a password recovery link, redirect to reset password page
    else if (type === "recovery") {
      // Preserve the hash parameters for authentication
      navigate(`/reset-password${location.hash}`, { replace: true });
    }
  }, [location.hash, navigate]);

  return <>{children}</>;
};

export default InvitationHandler;
