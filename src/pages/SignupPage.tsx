import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInvitation, setIsInvitation] = useState(false);

  const { signUp, acceptInvitation, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an invitation link by looking for hash parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");

    if (type === "invite" && accessToken) {
      setIsInvitation(true);
      // If user is already authenticated from the invitation link, populate their email
      if (user?.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    let result;
    if (isInvitation) {
      // Accept invitation by setting password for existing user
      result = await acceptInvitation(password, fullName);
    } else {
      // Regular signup
      result = await signUp(email, password, fullName);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      // For invitations, redirect to dashboard after a short delay
      if (isInvitation) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
            border: "1px solid #e2e8f0",
            width: "100%",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>
              {isInvitation ? "¡Invitación aceptada!" : "¡Registro exitoso!"}
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {isInvitation
                ? "Tu contraseña ha sido configurada. Redirigiendo al dashboard..."
                : "Tu cuenta ha sido creada. Ya puedes iniciar sesión."}
            </p>
          </div>

          {!isInvitation && (
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#3498db",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "500",
              }}
            >
              Ir a iniciar sesión
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
          border: "1px solid #e2e8f0",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              color: "#2c3e50",
              marginBottom: "10px",
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            {isInvitation ? "Configura tu cuenta" : "Crear cuenta"}
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            {isInvitation
              ? "Establece tu contraseña para completar el registro"
              : "Regístrate para acceder al sistema"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              placeholder="Tu nombre completo"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isInvitation}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
                backgroundColor: isInvitation ? "#f3f4f6" : "white",
                cursor: isInvitation ? "not-allowed" : "text",
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              placeholder="Confirma tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#9ca3af" : "#3498db",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading
              ? isInvitation
                ? "Configurando..."
                : "Creando cuenta..."
              : isInvitation
                ? "Configurar contraseña"
                : "Crear cuenta"}
          </button>
        </form>

        {!isInvitation && (
          <div
            style={{
              textAlign: "center",
              marginTop: "25px",
              paddingTop: "25px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                style={{
                  color: "#3498db",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
