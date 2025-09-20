import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import App from "./App";

const AppRouter = () => {
  console.log("🛣️ AppRouter component rendered");
  console.log("🛣️ Current URL:", window.location.href);
  console.log("🛣️ Current pathname:", window.location.pathname);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <>
                {console.log("🛣️ Rendering LoginPage route")}
                <LoginPage />
              </>
            }
          />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <>
                {console.log(
                  "🛣️ Rendering dashboard route - entering ProtectedRoute"
                )}
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              </>
            }
          />

          {/* Redirect root to dashboard */}
          <Route
            path="/"
            element={
              <>
                {console.log("🛣️ Root route hit, redirecting to dashboard")}
                <Navigate to="/dashboard" replace />
              </>
            }
          />

          {/* Catch all route - redirect to dashboard */}
          <Route
            path="*"
            element={
              <>
                {console.log(
                  "🛣️ Catch-all route hit, redirecting to dashboard"
                )}
                <Navigate to="/dashboard" replace />
              </>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
