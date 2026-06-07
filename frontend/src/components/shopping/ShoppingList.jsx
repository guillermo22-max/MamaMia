import { useState } from "react";
import { api } from "../../services/api";

const initialItem = { name: "", quantity: "", category: "" };

export default function ShoppingList({ hideHeader = false, shoppingList, onChange }) {
  const [item, setItem] = useState(initialItem);
  const [error, setError] = useState("");

  async function addItem(event) {
    event.preventDefault();
    if (!item.name.trim()) return;
    setError("");
    try {
      await api.addShoppingItem(item);
      setItem(initialItem);
      onChange();
    } catch (err) {
      setError(err.message || "No se pudo añadir el artículo");
    }
  }

  async function toggleItem(currentItem) {
    await api.toggleShoppingItem(currentItem.id, !currentItem.is_completed);
    onChange();
  }

  async function deleteItem(id) {
    await api.deleteShoppingItem(id);
    onChange();
  }

  return (
    <section className="dashboard-section shopping-section" id="shopping">
      {!hideHeader && (
        <div className="section-heading">
          <span className="eyebrow">Organización</span>
          <h2>Lista de compras</h2>
          <p>Añade ingredientes y marca lo que ya compraste.</p>
        </div>
      )}
      <div className="shopping-layout">
        <form className="shopping-form card-surface" onSubmit={addItem}>
          <label>Artículo<input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} placeholder="Tomates" /></label>
          <label>Cantidad<input value={item.quantity} onChange={(e) => setItem({ ...item, quantity: e.target.value })} placeholder="500 g" /></label>
          <label>Categoría<input value={item.category} onChange={(e) => setItem({ ...item, category: e.target.value })} placeholder="Verduras" /></label>
          {error && <p className="error-box">{error}</p>}
          <button className="primary-button">Añadir a la lista</button>
        </form>
        <div className="shopping-items card-surface">
          {(shoppingList?.items || []).length === 0 ? (
            <p className="muted">Tu lista de compras está vacía.</p>
          ) : (
            <ul>
              {shoppingList.items.map((currentItem) => (
                <li key={currentItem.id} className={currentItem.is_completed ? "completed" : ""}>
                  <label>
                    <input type="checkbox" checked={currentItem.is_completed} onChange={() => toggleItem(currentItem)} />
                    <span>
                      <strong>{currentItem.name}</strong>
                      <small>{currentItem.quantity || "Sin cantidad"}{currentItem.category ? ` · ${currentItem.category}` : ""}</small>
                    </span>
                  </label>
                  <button className="icon-button" onClick={() => deleteItem(currentItem.id)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
