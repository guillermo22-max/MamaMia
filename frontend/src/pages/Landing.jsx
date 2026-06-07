import { useEffect, useState } from "react";
import AuthModal from "../components/auth/AuthModal";
import BrandLogo from "../components/layout/BrandLogo";
import ensaladaCesar from "../assets/landing/ensalada_cesar.png";
import pastaCarbonara from "../assets/landing/pasta_carbonara.png";
import polloEspeciado from "../assets/landing/pollo_especiado.png";
import risottoVerduras from "../assets/landing/risotto_de_verduras.png";
import salmonAsado from "../assets/landing/salmon_asado.png";

const features = [
  { title: "Recetas con IA", text: "Escribe ingredientes o una idea y recibe recetas completas al instante." },
  { title: "Lista de compras", text: "Guarda los ingredientes pendientes y controla tus compras desde la app." },
  { title: "Plan semanal", text: "Organiza desayunos, almuerzos y cenas para toda la semana." },
];

const inspirationCards = [
  { title: "Salmón asado", tag: "Cena ligera", image: salmonAsado },
  { title: "Pollo especiado", tag: "Almuerzo", image: polloEspeciado },
  { title: "Ensalada César", tag: "Saludable", image: ensaladaCesar },
  { title: "Pasta carbonara", tag: "Clásico italiano", image: pastaCarbonara },
];

function getVisibleCards(activeIndex) {
  return Array.from({ length: 3 }, (_, offset) => inspirationCards[(activeIndex + offset) % inspirationCards.length]);
}

export default function Landing({ authMode, onNavigate, onAuthSuccess }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const visibleCards = getVisibleCards(activeSlide);

  function moveSlider(direction) {
    setActiveSlide((current) => (current + direction + inspirationCards.length) % inspirationCards.length);
  }

  useEffect(() => {
    if (isSliderPaused) return undefined;
    const interval = window.setInterval(() => {
      moveSlider(1);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [isSliderPaused]);

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="brand-block">
          <BrandLogo />
          <div>
            <strong>MamaMia</strong>
            <span>IA de cocina</span>
          </div>
        </div>
        <div className="landing-actions">
          <button className="ghost-button" onClick={() => onNavigate("/login")}>Iniciar sesión</button>
          <button className="primary-button" onClick={() => onNavigate("/registro")}>Registrarse</button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">La mejor IA de cocina</span>
          <h1>Tu receta perfecta en segundos.</h1>
          <p>Introduce ingredientes y obtén recetas inteligentes, listas de compras y un plan semanal organizado para cocinar mejor.</p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={() => onNavigate("/registro")}>Comenzar gratis</button>
            <button className="secondary-button large" onClick={() => onNavigate("/login")}>Ya tengo cuenta</button>
          </div>
          <div className="hero-stats">
            <span><strong>4</strong> recetas por búsqueda</span>
            <span><strong>7</strong> días de planificación</span>
            <span><strong>100%</strong> personalizado</span>
          </div>
        </div>
        <div className="hero-visual card-surface" style={{ backgroundImage: `linear-gradient(135deg, rgba(255,255,255,.2), rgba(255,237,213,.45)), url(${risottoVerduras})` }}>
          <div className="floating-recipe main-recipe">
            <span>Receta sugerida</span>
            <h3>Risotto de verduras</h3>
            <p>Arroz, calabacín, champiñones, parmesano y especias suaves.</p>
          </div>
          <div className="floating-recipe small one">Lista de compras actualizada</div>
          <div className="floating-recipe small two">Cena guardada para el jueves</div>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card card-surface" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="preview-section">
        <div className="section-heading center">
          <span className="eyebrow">Inspiración</span>
          <h2>Idea de Recetas</h2>
        </div>
        <div className="preview-slider" onMouseEnter={() => setIsSliderPaused(true)} onMouseLeave={() => setIsSliderPaused(false)}>
          <button className="slider-button" onClick={() => moveSlider(-1)} aria-label="Ver recetas anteriores">‹</button>
          <div className="preview-grid">
            {visibleCards.map((card) => (
              <article className="preview-card card-surface" key={card.title}>
                <div style={{ backgroundImage: `url(${card.image})` }} />
                <span>{card.tag}</span>
                <h3>{card.title}</h3>
              </article>
            ))}
          </div>
          <button className="slider-button" onClick={() => moveSlider(1)} aria-label="Ver más recetas">›</button>
        </div>
        <div className="slider-dots" aria-label="Indicador del slider">
          {inspirationCards.map((card, index) => (
            <button
              className={activeSlide === index ? "active" : ""}
              key={card.title}
              onClick={() => setActiveSlide(index)}
              aria-label={`Ir a ${card.title}`}
            />
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand">
          <BrandLogo />
          <div>
            <strong>MamaMia</strong>
            <span>Recetas inteligentes para cocinar mejor.</span>
          </div>
        </div>
        <nav className="footer-links" aria-label="Enlaces del sitio">
          <button onClick={() => onNavigate("/registro")}>Crear cuenta</button>
          <button onClick={() => onNavigate("/login")}>Iniciar sesión</button>
        </nav>
        <p>© 2026 MamaMia. Todos los derechos reservados. Cocina organizada, simple y deliciosa.</p>
      </footer>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => onNavigate("/home")}
          onModeChange={(nextMode) => onNavigate(nextMode === "login" ? "/login" : nextMode === "forgot" ? "/recuperar-password" : "/registro")}
          onSuccess={onAuthSuccess}
        />
      )}
    </main>
  );
}
