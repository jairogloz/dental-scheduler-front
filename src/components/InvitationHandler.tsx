import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Component that detects invitation links and redirects to signup page
 * Invitation links come from Supabase with #access_token=...&type=invite
 */
const InvitationHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if URL hash contains invitation parameters
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const type = hashParams.get("type");

    // If this is an invitation link, redirect to signup page
    if (type === "invite") {
      // Preserve the hash parameters for SignupPage to read
      navigate(`/signup${location.hash}`, { replace: true });
    }
  }, [location.hash, navigate]);

  return <>{children}</>;
};

export default InvitationHandler;
