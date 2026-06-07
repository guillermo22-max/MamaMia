import { useState } from "react";
import { api } from "../../services/api";
import RecipeCard from "./RecipeCard";

const loadingSteps = [
  "Leyendo tu idea",
  "Diseñando recetas",
  "Calculando tiempos y calorías",
  "Preparando imágenes",
];

export default function RecipeGenerator({ hideHeader = false, onRecipeSaved }) {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generateRecipes(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setImageLoading(false);
    setMessage("");
    setRecipes([]);

    try {
      const data = await api.generateRecipes(query);
      const generatedRecipes = (data.recipes || []).map((recipe, index) => ({
        ...recipe,
        local_id: `${Date.now()}-${index}`,
        image_loading: true,
      }));
      setRecipes(generatedRecipes);
      setLoading(false);
      generateImages(generatedRecipes);
    } catch (err) {
      setMessage(err.message || "No se pudieron generar recetas");
      setLoading(false);
    }
  }

  async function generateImages(generatedRecipes) {
    setImageLoading(true);
    await Promise.all(generatedRecipes.map(async (recipe) => {
      try {
        const image = await api.generateRecipeImage({
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
        });
        setRecipes((currentRecipes) => currentRecipes.map((currentRecipe) => (
          currentRecipe.local_id === recipe.local_id
            ? { ...currentRecipe, ...image, image_loading: false }
            : currentRecipe
        )));
      } catch {
        setRecipes((currentRecipes) => currentRecipes.map((currentRecipe) => (
          currentRecipe.local_id === recipe.local_id
            ? { ...currentRecipe, image_loading: false, image_error: true }
            : currentRecipe
        )));
      }
    }));
    setImageLoading(false);
  }

  async function saveRecipe(recipe) {
    try {
      await api.createRecipe({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image_url: recipe.image_url || null,
        image_data: recipe.image_data || null,
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings: recipe.servings || null,
        calories_per_serving: recipe.calories_per_serving || null,
        difficulty: recipe.difficulty || null,
        category: recipe.category || null,
        tags: recipe.tags || [],
        is_public: false,
      });
      setMessage("Receta guardada correctamente.");
      onRecipeSaved?.();
    } catch (err) {
      setMessage(err.message || "No se pudo guardar la receta");
    }
  }

  return (
    <section className="generator-section" id="generator">
      {!hideHeader && (
        <div className="generator-copy">
          <span className="eyebrow">Generador de recetas con IA</span>
          <h1>Tu receta perfecta en segundos.</h1>
          <p>Introduce ingredientes, una idea o el tipo de comida que quieres preparar y MamaMia te propone recetas completas.</p>
        </div>
      )}
      <form className="generator-box" onSubmit={generateRecipes}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ejemplo: pasta con pollo, receta vegana rápida, arroz con verduras..." />
        <button className="primary-button" disabled={loading || !query.trim()}>{loading ? "Cocinando..." : "Generar recetas"}</button>
      </form>

      {loading && <RecipeGenerationLoader query={query} />}
      {imageLoading && <p className="status-message">Las recetas ya están listas. Las imágenes se están generando en segundo plano.</p>}
      {message && <p className="status-message">{message}</p>}

      {recipes.length > 0 && (
        <div className="recipe-grid generated-grid">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.local_id || recipe.id || recipe.title}
              recipe={recipe}
              imageLoading={recipe.image_loading}
              imageError={recipe.image_error}
              onSave={!recipe.image_loading ? () => saveRecipe(recipe) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecipeGenerationLoader({ query }) {
  return (
    <div className="generation-loader card-surface" role="status" aria-live="polite">
      <div className="generation-loader-copy">
        <span>Generando recetas</span>
        <h3>{query}</h3>
        <p>Primero mostraremos las recetas. Las imágenes se cargarán aparte para que no tengas que esperar todo junto.</p>
      </div>
      <div className="generation-steps">
        {loadingSteps.map((step, index) => (
          <div className="generation-step" key={step} style={{ animationDelay: `${index * 0.35}s` }}>
            <i>{index + 1}</i>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      <div className="recipe-skeleton-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="recipe-skeleton" key={item}>
            <div />
            <span />
            <strong />
            <p />
          </div>
        ))}
      </div>
    </div>
  );
}
