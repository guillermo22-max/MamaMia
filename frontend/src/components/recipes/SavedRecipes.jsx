import { useMemo, useState } from "react";
import RecipeCard from "./RecipeCard";

function recipeMatches(recipe, query) {
  const text = [
    recipe.title,
    recipe.description,
    recipe.category,
    recipe.difficulty,
    recipe.calories_per_serving,
    recipe.ingredients,
    ...(recipe.tags || []),
  ].filter(Boolean).join(" ").toLowerCase();

  return text.includes(query.toLowerCase().trim());
}

export default function SavedRecipes({ hideHeader = false, recipes, onDelete, onCreate }) {
  const [query, setQuery] = useState("");
  const filteredRecipes = useMemo(() => {
    if (!query.trim()) return recipes;
    return recipes.filter((recipe) => recipeMatches(recipe, query));
  }, [recipes, query]);

  return (
    <section className="dashboard-section" id="recipes">
      {!hideHeader && (
        <div className="section-heading">
          <span className="eyebrow">Recetario</span>
          <h2>Mis recetas guardadas</h2>
          <p>Recetas que has generado y guardado en tu cuenta.</p>
        </div>
      )}
      {recipes.length === 0 ? (
        <div className="empty-state card-surface">
          <p>Todavía no tienes recetas guardadas.</p>
          {onCreate && <button className="primary-button" onClick={onCreate}>Generar mi primera receta</button>}
        </div>
      ) : (
        <>
          <div className="recipe-search">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, ingredientes, categoría..." />
            <span>{filteredRecipes.length} de {recipes.length} recetas</span>
          </div>
          {filteredRecipes.length === 0 ? (
            <div className="empty-state card-surface">
              <p>No encontramos recetas para “{query}”.</p>
              <button className="secondary-button" onClick={() => setQuery("")}>Limpiar búsqueda</button>
            </div>
          ) : (
            <div className="recipe-grid">
              {filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onDelete={() => onDelete(recipe.id)} />)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
