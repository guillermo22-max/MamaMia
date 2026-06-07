import { useMemo, useState } from "react";
import BrandLogo from "../components/layout/BrandLogo";
import { api } from "../services/api";

export default function ResetPassword({ onNavigate }) {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("El enlace de restablecimiento no es valido.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.resetPassword({ token, password: form.password });
      setMessage(data.message);
      setForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contrasena.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reset-page">
      <section className="reset-card card-surface">
        <div className="reset-brand">
          <BrandLogo />
          <div>
            <strong>MamaMia</strong>
            <span>Recupera tu cuenta</span>
          </div>
        </div>

        <span className="eyebrow">Nueva contrasena</span>
        <h1>Restablece tu acceso</h1>
        <p className="muted">Crea una contrasena nueva para volver a tus recetas, tu lista de compras y tu plan semanal.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nueva contrasena
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Minimo 6 caracteres"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Ocultar" : "Ver"}</button>
            </div>
          </label>

          <label>
            Confirmar contrasena
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Repite la contrasena"
              required
            />
          </label>

          {error && <p className="error-box">{error}</p>}
          {message && <p className="success-box">{message}</p>}

          <button className="primary-button full" disabled={loading || !token}>
            {loading ? "Actualizando..." : "Guardar nueva contrasena"}
          </button>
        </form>

        <button className="text-button full" type="button" onClick={() => onNavigate("/login")}>
          Volver a iniciar sesion
        </button>
      </section>
    </main>
  );
}
