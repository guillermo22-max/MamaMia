import { useEffect, useState } from "react";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import BrandLogo from "./components/layout/BrandLogo.jsx";
import { api, clearSession, getStoredUser } from "./services/api";

const dashboardRoutes = {
  "/app/buscar-recetas": "generator",
  "/app/mis-recetas": "recipes",
  "/app/lista-compra": "shopping",
  "/app/plan-semanal": "planner",
};

const viewRoutes = {
  generator: "/app/buscar-recetas",
  recipes: "/app/mis-recetas",
  shopping: "/app/lista-compra",
  planner: "/app/plan-semanal",
};

function getPath() {
  return window.location.pathname;
}

function navigateTo(path, replace = false) {
  if (getPath() === path) return;
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function normalizeInitialRoute(user) {
  const path = getPath();
  const publicRoutes = ["/home", "/login", "/registro", "/recuperar-password", "/restablecer-password"];

  if (window.location.hash) {
    navigateTo(user ? "/app/buscar-recetas" : "/home", true);
    return;
  }

  if (path === "/" || path === "") {
    navigateTo(user ? "/app/buscar-recetas" : "/home", true);
    return;
  }

  if (user && ["/home", "/login", "/registro", "/recuperar-password"].includes(path)) {
    navigateTo("/app/buscar-recetas", true);
    return;
  }

  if (user && path.startsWith("/app") && !dashboardRoutes[path]) {
    navigateTo("/app/buscar-recetas", true);
    return;
  }

  if (!user && path.startsWith("/app")) {
    navigateTo("/login", true);
    return;
  }

  if (!user && !publicRoutes.includes(path)) {
    navigateTo("/home", true);
  }
}

export default function App() {
  const [path, setPath] = useState(getPath());
  const [user, setUser] = useState(() => getStoredUser());
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    function handleRouteChange() {
      setPath(getPath());
    }
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  useEffect(() => {
    let active = true;
    async function verifySession() {
      if (!localStorage.getItem("token")) {
        setCheckingSession(false);
        normalizeInitialRoute(null);
        return;
      }
      try {
        const currentUser = await api.me();
        if (active) {
          localStorage.setItem("user", JSON.stringify(currentUser));
          setUser(currentUser);
          normalizeInitialRoute(currentUser);
        }
      } catch {
        clearSession();
        if (active) {
          setUser(null);
          normalizeInitialRoute(null);
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    verifySession();
    return () => {
      active = false;
    };
  }, []);

  function handleAuthSuccess(currentUser) {
    setUser(currentUser);
    navigateTo("/app/buscar-recetas", true);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    navigateTo("/home");
  }

  if (checkingSession) {
    return (
      <main className="app-loader">
        <div className="loader-card">
          <BrandLogo className="loader-logo" />
          <p>Cargando tu cocina inteligente...</p>
        </div>
      </main>
    );
  }

  if (user) {
    const activeView = dashboardRoutes[path] || "generator";
    return (
      <Dashboard
        user={user}
        activeView={activeView}
        onNavigate={(view) => navigateTo(viewRoutes[view])}
        onLogout={handleLogout}
      />
    );
  }

  if (!user && path === "/restablecer-password") {
    return <ResetPassword onNavigate={navigateTo} />;
  }

  const authMode = path === "/login" ? "login" : path === "/registro" ? "signup" : path === "/recuperar-password" ? "forgot" : null;
  return (
    <Landing
      authMode={authMode}
      onNavigate={navigateTo}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}
