import { useEffect, useState } from "react";
import MealPlanner from "../components/meal-planner/MealPlanner";
import BrandLogo from "../components/layout/BrandLogo";
import RecipeGenerator from "../components/recipes/RecipeGenerator";
import SavedRecipes from "../components/recipes/SavedRecipes";
import ShoppingList from "../components/shopping/ShoppingList";
import { api } from "../services/api";
import { addDays, toISODate } from "../utils/date";

const views = {
  generator: {
    eyebrow: "Buscador",
    title: "Buscar recetas",
    description: "Genera recetas nuevas con IA a partir de ingredientes, antojos o ideas rápidas.",
  },
  recipes: {
    eyebrow: "Recetario",
    title: "Mis recetas",
    description: "Gestiona y explora tus recetas guardadas favoritas.",
    action: "Añadir receta",
  },
  shopping: {
    eyebrow: "Compras",
    title: "Lista de la compra",
    description: "Organiza ingredientes, cantidades y categorías antes de cocinar.",
  },
  planner: {
    eyebrow: "Calendario",
    title: "Plan semanal de comida",
    description: "Planifica desayunos, almuerzos y cenas para toda la semana.",
  },
};

export default function Dashboard({ user, activeView = "generator", onNavigate, onLogout }) {
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecipes() {
    const data = await api.listRecipes();
    setRecipes(data);
  }

  async function loadShoppingList() {
    const data = await api.getShoppingList();
    setShoppingList(data);
  }

  async function loadMealPlan(date = selectedWeek) {
    const data = await api.getMealPlan(toISODate(date));
    setMealPlan(data);
  }

  async function loadAll(date = selectedWeek) {
    setError("");
    try {
      await Promise.all([loadRecipes(), loadShoppingList(), loadMealPlan(date)]);
    } catch (err) {
      setError(err.message || "Error cargando los datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function deleteRecipe(id) {
    await api.deleteRecipe(id);
    await loadRecipes();
    await loadMealPlan();
  }

  function changeWeek(days) {
    const nextWeek = addDays(selectedWeek, days);
    setSelectedWeek(nextWeek);
    loadMealPlan(nextWeek).catch((err) => setError(err.message));
  }

  const currentView = views[activeView] || views.generator;

  if (loading) {
    return (
      <main className="app-loader">
        <div className="loader-card">
          <BrandLogo className="loader-logo" />
          <p>Cargando recetas, compras y calendario...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <BrandLogo />
          <strong>MamaMia</strong>
        </div>
        <div className="sidebar-user">
          <span>Mi sección</span>
          <strong>{user?.name || "Usuario"}</strong>
        </div>
        <nav className="sidebar-nav" aria-label="Panel principal">
          <button className={activeView === "generator" ? "active" : ""} onClick={() => onNavigate("generator")}>
            <span aria-hidden="true">⌕</span>
            Buscar recetas
          </button>
          <button className={activeView === "recipes" ? "active" : ""} onClick={() => onNavigate("recipes")}>
            <span aria-hidden="true">▤</span>
            Mis recetas
          </button>
          <button className={activeView === "shopping" ? "active" : ""} onClick={() => onNavigate("shopping")}>
            <span aria-hidden="true">□</span>
            Lista de la compra
          </button>
          <button className={activeView === "planner" ? "active" : ""} onClick={() => onNavigate("planner")}>
            <span aria-hidden="true">▦</span>
            Plan semanal
          </button>
        </nav>
        <button className="sidebar-primary" onClick={() => onNavigate("generator")}>+ Añadir receta</button>
        <button className="sidebar-logout" onClick={onLogout}>Cerrar sesión</button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">{currentView.eyebrow}</span>
            <h1>{currentView.title}</h1>
            <p>{currentView.description}</p>
          </div>
          {activeView === "recipes" && (
            <button className="primary-button" onClick={() => onNavigate("generator")}>
              + {currentView.action}
            </button>
          )}
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-view">
          {activeView === "generator" && <RecipeGenerator hideHeader onRecipeSaved={loadRecipes} />}
          {activeView === "recipes" && <SavedRecipes hideHeader recipes={recipes} onDelete={deleteRecipe} onCreate={() => onNavigate("generator")} />}
          {activeView === "shopping" && <ShoppingList hideHeader shoppingList={shoppingList} onChange={loadShoppingList} />}
          {activeView === "planner" && <MealPlanner hideHeader mealPlan={mealPlan} recipes={recipes} selectedWeek={selectedWeek} onWeekChange={changeWeek} onChange={() => loadMealPlan()} />}
        </div>
      </section>
    </main>
  );
}
