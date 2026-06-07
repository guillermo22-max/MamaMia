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

Edita `backend/.env` con tus valores reales antes de iniciar el backend.

Puedes usar `backend/.env.example` como guia.

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

## Notas

La base de datos por defecto es SQLite y se crea localmente como `backend/mamamia.db`. Para despliegue real puedes cambiar `DATABASE_URL` por una base de datos remota compatible con SQLAlchemy.
