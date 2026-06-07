import BrandLogo from "./BrandLogo";

export default function Header({ user, onLogout }) {
  return (
    <header className="site-header">
      <div className="brand-block">
        <BrandLogo />
        <div>
          <strong>MamaMia</strong>
          <span>IA de cocina</span>
        </div>
      </div>
      <nav className="header-actions">
        <a href="#generator">Generador</a>
        <a href="#recipes">Recetas</a>
        <a href="#shopping">Compras</a>
        <a href="#planner">Plan semanal</a>
        {user && <span className="user-pill">Hola, {user.name}</span>}
        {onLogout && <button className="ghost-button" onClick={onLogout}>Salir</button>}
      </nav>
    </header>
  );
}
