import { useMemo, useState } from "react";
import { api } from "../../services/api";
import { formatDayName, formatReadableDate, getWeekDays, mealTypes, toISODate } from "../../utils/date";

function buildRecipeImage(recipe) {
  if (!recipe) return "";
  if (recipe.image_data) return `data:image/png;base64,${recipe.image_data}`;
  if (recipe.image_url) return recipe.image_url;
  const query = encodeURIComponent(`${recipe.title || "recipe"} food dish`);
  return `https://source.unsplash.com/500x360/?${query}`;
}

function setDragPayload(event, payload) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/json", JSON.stringify(payload));
}

export default function MealPlanner({ hideHeader = false, mealPlan, recipes, selectedWeek, onWeekChange, onChange }) {
  const [savingKey, setSavingKey] = useState("");
  const [hoverKey, setHoverKey] = useState("");
  const [error, setError] = useState("");
  const days = useMemo(() => getWeekDays(selectedWeek), [selectedWeek]);

  function findMeal(day, mealType) {
    const iso = toISODate(day);
    return mealPlan?.meal_plans?.find((meal) => meal.date === iso && meal.meal_type === mealType);
  }

  function cellKey(day, mealType) {
    return `${toISODate(day)}-${mealType}`;
  }

  async function saveRecipeInCell(day, mealType, recipeId) {
    const key = cellKey(day, mealType);
    setError("");
    setSavingKey(key);
    try {
      await api.saveMealPlan({
        date: toISODate(day),
        meal_type: mealType,
        recipe_id: Number(recipeId),
        custom_meal: null,
        notes: null,
      });
      onChange();
    } catch (err) {
      setError(err.message || "No se pudo guardar la receta.");
    } finally {
      setSavingKey("");
    }
  }

  async function moveMeal(day, mealType, payload) {
    const targetKey = cellKey(day, mealType);
    const sourceKey = `${payload.source_date}-${payload.source_meal_type}`;
    if (targetKey === sourceKey) return;

    setError("");
    setSavingKey(targetKey);
    try {
      await api.updateMealPlan(payload.meal_id, {
        date: toISODate(day),
        meal_type: mealType,
        recipe_id: payload.recipe_id ? Number(payload.recipe_id) : null,
        custom_meal: payload.custom_meal || null,
        notes: payload.notes || null,
      });
      onChange();
    } catch (err) {
      setError(err.message || "No se pudo mover la receta.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleDrop(event, day, mealType) {
    event.preventDefault();
    setHoverKey("");
    const rawPayload = event.dataTransfer.getData("application/json");
    if (!rawPayload) return;

    const payload = JSON.parse(rawPayload);
    if (payload.kind === "recipe") {
      await saveRecipeInCell(day, mealType, payload.recipe_id);
    }
    if (payload.kind === "meal") {
      await moveMeal(day, mealType, payload);
    }
  }

  async function removeMeal(meal) {
    if (!meal?.id) return;
    setError("");
    setSavingKey(String(meal.id));
    try {
      await api.deleteMealPlan(meal.id);
      onChange();
    } catch (err) {
      setError(err.message || "No se pudo quitar la comida.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <section className="dashboard-section" id="planner">
      <div className={hideHeader ? "planner-heading compact" : "section-heading planner-heading"}>
        {!hideHeader && (
          <div>
            <span className="eyebrow">Calendario</span>
            <h2>Plan semanal</h2>
            <p>Arrastra una receta guardada al día y comida que quieras.</p>
          </div>
        )}
        <div className="week-controls">
          <button className="ghost-button" onClick={() => onWeekChange(-7)}>Semana anterior</button>
          <button className="secondary-button" onClick={() => onWeekChange(7)}>Semana siguiente</button>
        </div>
      </div>

      {error && <p className="error-box">{error}</p>}

      <div className="recipe-drag-tray card-surface">
        {recipes.length === 0 ? (
          <p className="muted">Guarda una receta primero para poder planificarla.</p>
        ) : (
          recipes.map((recipe) => (
            <div
              className="draggable-recipe"
              draggable
              key={recipe.id}
              onDragStart={(event) => setDragPayload(event, { kind: "recipe", recipe_id: recipe.id })}
            >
              <div style={{ backgroundImage: `url(${buildRecipeImage(recipe)})` }} />
              <strong>{recipe.title}</strong>
            </div>
          ))
        )}
      </div>

      <div className="planner-grid card-surface">
        <div className="planner-corner">Comida</div>
        {days.map((day) => (
          <div className="planner-day" key={toISODate(day)}>
            <strong>{formatDayName(day)}</strong>
            <span>{formatReadableDate(day)}</span>
          </div>
        ))}
        {mealTypes.map((mealType) => (
          <FragmentRow
            key={mealType}
            mealType={mealType}
            days={days}
            findMeal={findMeal}
            removeMeal={removeMeal}
            cellKey={cellKey}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            handleDrop={handleDrop}
            savingKey={savingKey}
          />
        ))}
      </div>
    </section>
  );
}

function FragmentRow({ mealType, days, findMeal, removeMeal, cellKey, hoverKey, setHoverKey, handleDrop, savingKey }) {
  return (
    <>
      <div className="planner-meal-type">{mealType}</div>
      {days.map((day) => {
        const meal = findMeal(day, mealType);
        const key = cellKey(day, mealType);
        const image = buildRecipeImage(meal?.recipe);
        const isSaving = savingKey === key || savingKey === String(meal?.id);

        return (
          <div
            className={`${meal ? "planner-cell has-meal" : "planner-cell"} ${hoverKey === key ? "drop-hover" : ""}`}
            key={key}
            onDragOver={(event) => {
              event.preventDefault();
              setHoverKey(key);
            }}
            onDragLeave={() => setHoverKey("")}
            onDrop={(event) => handleDrop(event, day, mealType)}
          >
            {meal ? (
              <div
                className="planned-meal"
                draggable
                onDragStart={(event) => setDragPayload(event, {
                  kind: "meal",
                  meal_id: meal.id,
                  source_date: meal.date,
                  source_meal_type: meal.meal_type,
                  recipe_id: meal.recipe_id,
                  custom_meal: meal.custom_meal,
                  notes: meal.notes,
                })}
              >
                {image && <div className="planned-meal-image" style={{ backgroundImage: `url(${image})` }} />}
                <div className="planned-meal-body">
                  <span>{mealType}</span>
                  <strong>{meal.recipe?.title || meal.custom_meal || "Comida personalizada"}</strong>
                  <small>Arrastra para mover</small>
                </div>
                <button className="remove-meal-button" onClick={() => removeMeal(meal)} disabled={isSaving}>Quitar</button>
              </div>
            ) : (
              <div className="planner-empty">{isSaving ? "Guardando..." : "Suelta una receta aquí"}</div>
            )}
          </div>
        );
      })}
    </>
  );
}
