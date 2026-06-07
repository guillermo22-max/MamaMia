const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function setSession(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) clearSession();
  if (!response.ok) throw new Error(data.detail || data.error || "Error de servidor");
  return data;
}

export const api = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (email) => request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (payload) => request("/api/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/auth/me"),

  generateRecipes: (query) => request("/api/recipes/generate", { method: "POST", body: JSON.stringify({ query }) }),
  generateRecipeImage: (recipe) => request("/api/recipes/generate-image", { method: "POST", body: JSON.stringify(recipe) }),
  listRecipes: () => request("/api/recipes"),
  createRecipe: (recipe) => request("/api/recipes", { method: "POST", body: JSON.stringify(recipe) }),
  getRecipe: (id) => request(`/api/recipes/${id}`),
  deleteRecipe: (id) => request(`/api/recipes/${id}`, { method: "DELETE" }),

  getShoppingList: () => request("/api/shopping-list"),
  addShoppingItem: (item) => request("/api/shopping-list/items", { method: "POST", body: JSON.stringify(item) }),
  toggleShoppingItem: (id, isCompleted) => request(`/api/shopping-list/items/${id}`, { method: "PATCH", body: JSON.stringify({ is_completed: isCompleted }) }),
  deleteShoppingItem: (id) => request(`/api/shopping-list/items/${id}`, { method: "DELETE" }),

  getMealPlan: (week) => request(`/api/meal-plan${week ? `?week=${week}` : ""}`),
  saveMealPlan: (payload) => request("/api/meal-plan", { method: "POST", body: JSON.stringify(payload) }),
  updateMealPlan: (id, payload) => request(`/api/meal-plan/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteMealPlan: (id) => request(`/api/meal-plan/${id}`, { method: "DELETE" }),
};
