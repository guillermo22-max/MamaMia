import { useMemo, useState } from "react";

function buildImage(recipe) {
  if (recipe.image_data) return `data:image/png;base64,${recipe.image_data}`;
  if (recipe.image_url) return recipe.image_url;
  const query = encodeURIComponent(`${recipe.title || "recipe"} food dish`);
  return `https://source.unsplash.com/600x420/?${query}`;
}

function clampServings(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(20, Math.max(1, Math.round(parsed)));
}

export default function RecipeCard({ recipe, imageLoading = false, imageError = false, onSave, onDelete, compact = false }) {
  const baseServings = clampServings(recipe.servings || 2);
  const [servings, setServings] = useState(baseServings);
  const caloriesPerServing = Number(recipe.calories_per_serving || 0);
  const totalCalories = useMemo(() => caloriesPerServing * servings, [caloriesPerServing, servings]);

  function changeServings(nextValue) {
    setServings(clampServings(nextValue));
  }

  return (
    <article className={`recipe-card ${compact ? "compact" : ""}`}>
      <div className={imageLoading ? "recipe-image image-loading" : "recipe-image"} style={!imageLoading ? { backgroundImage: `url(${buildImage(recipe)})` } : undefined}>
        <span>{imageLoading ? "Creando imagen" : recipe.category || "Receta"}</span>
        {imageLoading && <strong>Generando imagen...</strong>}
        {imageError && <strong>Imagen no disponible</strong>}
      </div>
      <div className="recipe-content">
        <h3>{recipe.title}</h3>
        <p>{recipe.description || "Una receta deliciosa generada para tu cocina."}</p>
        <div className="recipe-meta">
          <span>{Number(recipe.prep_time || 0) + Number(recipe.cook_time || 0) || 30} min</span>
          <span>{recipe.difficulty || "Fácil"}</span>
          <span>{caloriesPerServing ? `${caloriesPerServing} kcal/persona` : "Kcal no disponibles"}</span>
        </div>
        <div className="servings-control">
          <div>
            <span>Personas</span>
            <strong>{servings}</strong>
          </div>
          <div className="servings-stepper">
            <button type="button" onClick={() => changeServings(servings - 1)} aria-label="Reducir personas">-</button>
            <input value={servings} onChange={(event) => changeServings(event.target.value)} inputMode="numeric" aria-label="Cantidad de personas" />
            <button type="button" onClick={() => changeServings(servings + 1)} aria-label="Aumentar personas">+</button>
          </div>
          <div className="calories-total">
            <span>Calorías estimadas</span>
            <strong>{caloriesPerServing ? `${totalCalories} kcal` : "Sin dato"}</strong>
          </div>
        </div>
        {!compact && (
          <div className="recipe-details">
            <details>
              <summary>Ingredientes</summary>
              <pre>{recipe.ingredients}</pre>
            </details>
            <details>
              <summary>Preparación</summary>
              <pre>{recipe.instructions}</pre>
            </details>
          </div>
        )}
        <div className="card-actions">
          {onSave && <button className="primary-button" onClick={onSave}>Guardar receta</button>}
          {imageLoading && <button className="secondary-button" disabled>Esperando imagen</button>}
          {onDelete && <button className="danger-button" onClick={onDelete}>Eliminar</button>}
        </div>
      </div>
    </article>
  );
}
