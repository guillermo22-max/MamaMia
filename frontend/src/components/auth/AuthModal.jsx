import { useEffect, useState } from "react";
import { api, setSession } from "../../services/api";

const initialForm = { name: "", email: "", password: "" };

export default function AuthModal({ mode = "login", onClose, onModeChange, onSuccess }) {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isForgotPassword, setIsForgotPassword] = useState(mode === "forgot");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLogin(mode === "login");
    setIsForgotPassword(mode === "forgot");
    setError("");
    setMessage("");
  }, [mode]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleMode() {
    const nextMode = isLogin ? "signup" : "login";
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError("");
    setMessage("");
    onModeChange?.(nextMode);
  }

  function openForgotPassword() {
    setIsLogin(false);
    setIsForgotPassword(true);
    setError("");
    setMessage("");
    onModeChange?.("forgot");
  }

  function backToLogin() {
    setIsLogin(true);
    setIsForgotPassword(false);
    setError("");
    setMessage("");
    onModeChange?.("login");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (isForgotPassword) {
        const data = await api.forgotPassword(form.email);
        setMessage(data.message);
        return;
      }

      const data = isLogin ? await api.login(form) : await api.signup(form);
      setSession(data);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message || "No se pudo completar la accion");
    } finally {
      setLoading(false);
    }
  }

  const title = isForgotPassword ? "Restablecer contrasena" : isLogin ? "Iniciar sesion" : "Registrarse";
  const intro = isForgotPassword
    ? "Escribe tu correo y te enviaremos un enlace para crear una nueva contrasena."
    : isLogin
      ? "Entra para guardar recetas, listas de compras y tu plan semanal."
      : "Guarda tus recetas generadas y organiza tu cocina desde un solo lugar.";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="auth-modal card-surface">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">x</button>
        <span className="eyebrow">{isForgotPassword ? "Recupera tu acceso" : isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</span>
        <h2>{title}</h2>
        <p className="muted">{intro}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && !isForgotPassword && (
            <label>
              Nombre
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Luis Guillermo Soto" required />
            </label>
          )}

          <label>
            Correo electronico
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="tu-correo@email.com" required />
          </label>

          {!isForgotPassword && (
            <label>
              Contrasena
              <div className="password-field">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Minimo 6 caracteres" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Ocultar" : "Ver"}</button>
              </div>
            </label>
          )}

          {isLogin && !isForgotPassword && (
            <button className="forgot-link" type="button" onClick={openForgotPassword}>
              Olvide mi contrasena
            </button>
          )}

          {error && <p className="error-box">{error}</p>}
          {message && <p className="success-box">{message}</p>}

          <button className="primary-button full" disabled={loading}>
            {loading ? "Procesando..." : isForgotPassword ? "Enviar enlace" : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {isForgotPassword ? (
          <button className="text-button full" type="button" onClick={backToLogin}>
            Volver a iniciar sesion
          </button>
        ) : (
          <button className="text-button full" type="button" onClick={toggleMode}>
            {isLogin ? "No tengo cuenta, quiero registrarme" : "Ya tengo cuenta, iniciar sesion"}
          </button>
        )}
      </section>
    </div>
  );
}
