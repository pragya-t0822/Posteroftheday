# Poster of the Day — Claude Project Config

## Project Structure
- `backend/` — Laravel 12 REST API (PHP)
- `frontend/` — React + Vite Admin Panel (JS)

## Backend
- Framework: Laravel 12
- Auth: Laravel Sanctum (Bearer token)
- DB: MySQL — database name `poster_of_the_day`
- API prefix: `/api`
- Controllers live in `app/Http/Controllers/Api/`
- Run: `php artisan serve` (http://localhost:8000)

## Frontend
- Bundler: Vite + React
- State management: Redux Toolkit (`src/features/`)
- HTTP client: Axios (`src/api/axios.js`) — auto-attaches Bearer token
- Routing: React Router v6
- Run: `npm run dev` (http://localhost:5173)
- API base URL set via `VITE_API_URL` in `.env`

## Conventions
- All API controllers extend `App\Http\Controllers\Controller`
- API responses are JSON only — no Blade views used in backend
- Redux slices go in `src/features/<feature>/`
- Pages go in `src/pages/<section>/`
- Shared components go in `src/components/`
