# MamaMia

MamaMia es una aplicacion full-stack para generar recetas con IA, guardar recetas favoritas, crear listas de compra y planificar comidas semanales con drag and drop.

## Caracteristicas

- Generacion de recetas con OpenAI.
- Generacion de imagenes para recetas.
- Recetas guardadas con buscador.
- Lista de compra por usuario.
- Plan semanal de comidas.
- Autenticacion con JWT.
- Restablecimiento de contrasena por correo SMTP.
- Backend organizado por dominios: rutas, modelos, servicios y plantillas.

## Tecnologias

Backend:
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT con `python-jose`
- Passlib + bcrypt
- OpenAI API

Frontend:
- React
- Vite
- Tailwind CSS

## Estructura

```text
backend/
  app/
    api/routes/
      meal_plan/
      recipe/
      shopping/
      user/
    core/
    db/
    models/
      meal_plan/
      recipe/
      shopping/
      user/
    services/
      email/
      openai/
    templates/
    main.py
    schemas.py
    utils.py
  requirements.txt
  .env.example

frontend/
  public/
  src/
    assets/
    components/
    pages/
    services/
    styles/
    utils/
    App.jsx
    main.jsx
  package.json
```

## Requisitos

- Python 3.12+
- Node.js 18+
- npm
- Una API key de OpenAI
- Cuenta SMTP para enviar correos de restablecimiento de contrasena

## Configurar Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
```

Copia el ejemplo de variables de entorno:

```bash
copy .env.example .env
```

Edita `backend/.env` con tus valores reales:

```env
APP_NAME=MamaMia API
DATABASE_URL=sqlite:///./mamamia.db
SECRET_KEY=usa_una_clave_larga_aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
TRUSTED_HOSTS=localhost,127.0.0.1,testserver

OPENAI_API_KEY=tu_openai_api_key
OPENAI_RECIPE_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1-mini

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-correo@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_FROM_EMAIL=tu-correo@gmail.com
SMTP_FROM_NAME=MamaMia
SMTP_USE_TLS=true
PASSWORD_RESET_EXPIRE_MINUTES=60
```

Para Gmail, `SMTP_PASSWORD` debe ser una App Password, no la contrasena normal.

Ejecuta el backend:

```bash
uvicorn app.main:app --reload
```

La API queda disponible en:

```text
http://localhost:8000
```

## Configurar Frontend

```bash
cd frontend
npm install
```

Opcionalmente crea `frontend/.env` si necesitas cambiar la URL del backend:

```env
VITE_API_URL=http://localhost:8000
```

Ejecuta el frontend:

```bash
npm run dev
```

La app queda disponible en:

```text
http://localhost:5173
```

## Build De Produccion

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
venv\Scripts\activate
python -m compileall -q app
```

## Docker

Tambien puedes levantar todo el proyecto con Docker Compose.

Primero crea y completa el archivo de entorno del backend:

```bash
cd backend
copy .env.example .env
```

Vuelve a la raiz del proyecto y construye los contenedores:

```bash
cd ..
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

El contenedor del backend usa SQLite en un volumen Docker llamado `mamamia_data`, por lo que los datos sobreviven a reinicios de contenedores.

Comandos utiles:

```bash
docker compose up --build
docker compose down
docker compose logs -f backend
docker compose logs -f frontend
```

## Seguridad

- No subas `backend/.env`, `frontend/.env`, bases de datos locales ni `venv`.
- `.gitignore` ya excluye secretos, entornos virtuales, `node_modules`, `dist` y archivos `.db`.
- `SECRET_KEY` es obligatorio y debe ser largo y aleatorio.
- CORS y trusted hosts se configuran desde variables de entorno.
- Los endpoints de auth tienen rate limiting basico.
- Los mensajes publicos no exponen claves, SMTP ni detalles internos de proveedores.
- Para produccion, considera mover la autenticacion a cookies `HttpOnly`, `Secure` y `SameSite`.

## Rutas Principales

Backend:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/recipes`
- `POST /api/recipes`
- `POST /api/recipes/generate`
- `POST /api/recipes/generate-image`
- `GET /api/shopping-list`
- `POST /api/shopping-list/items`
- `GET /api/meal-plan`
- `POST /api/meal-plan`

Frontend:

- `/home`
- `/login`
- `/registro`
- `/recuperar-password`
- `/restablecer-password?token=...`
- `/app/buscar-recetas`
- `/app/mis-recetas`
- `/app/lista-compra`
- `/app/plan-semanal`

## Notas

La base de datos por defecto es SQLite y se crea localmente como `backend/mamamia.db`. Para despliegue real puedes cambiar `DATABASE_URL` por una base de datos remota compatible con SQLAlchemy.
