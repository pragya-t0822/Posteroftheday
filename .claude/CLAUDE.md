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

## Agents (`.claude/agents/`)
Specialized AI assistants with isolated context. Invoke with `@agent-name` or let Claude delegate automatically.

| Agent | Purpose |
|-------|---------|
| `@orchestrator` | Coordinates full-stack features end-to-end (migration → model → controller → slice → page) |
| `@backend_agent` | Laravel 12 controllers, models, migrations, routes, Sanctum auth |
| `@frontend_agent` | React pages, Redux slices, routing, Tailwind UI, Sidebar navigation |
| `@database_agent` | MySQL schema design, migrations, query optimization, tinker commands |
| `@qa_agent` | Post-build quality review — checks registrations, cross-references, common mistakes |
| `@security_agent` | Security audit — auth, validation, file uploads, data exposure |
| `@product_agent` | Feature analysis — breaks requests into data model, API, UI, and acceptance criteria |
| `@devops_agent` | XAMPP setup, builds, storage links, deployment, troubleshooting |

## Skills (`.claude/skills/`)
Reusable workflows invoked with `/skill-name [args]`.

| Skill | Usage | What it does |
|-------|-------|-------------|
| `/create-crud` | `/create-crud banners` | Scaffolds full stack: migration, model, controller, routes, slice, page, nav |
| `/create-migration` | `/create-migration add_color_to_frames` | Generates Laravel migration and runs it immediately |
| `/review-code` | `/review-code FrameLayerController` | Quick quality check on changed files for common mistakes |
| `/test-api` | `/test-api FrameLayerController` | Static analysis of controller, routes, model, and validation alignment |
| `/ui-ux-pro-max` | (auto-loaded) | UI/UX design system reference with component patterns |

## Lessons Learned (Self-Improving Playbook)
> When a mistake is made during development, log it here so it never happens again.

### Navigation & Routing
- When renaming a page/route, always update ALL of: App.jsx route, NavigationSeeder, the DB row (via tinker), and the Sidebar icon map. Missing any one causes broken nav.
- The sidebar icon map in `Sidebar.jsx` must have an entry for every icon name used in `NavigationSeeder`. Always check before using a new icon name.

### Backend Patterns
- Frame layers belong to frames (not categories directly). Filter by category must go through the `frame` relationship using `whereHas`.
- When adding a JSON column, always add it to both the migration AND the model's `$fillable` + `casts` arrays in the same step.
- Use `'_method' => 'PUT'` via POST for multipart/form-data updates (Laravel doesn't support PUT with file uploads natively).

### Frontend Patterns
- Redux slices must be registered in `src/app/store.js` — forgetting this silently breaks the page with no clear error.
- When a page needs data from another slice (e.g., frame layers needing frames list), dispatch that fetch in the page's `useEffect` with a high `per_page` to get all options.
- SearchableSelect is duplicated per page, not shared. If adding to a new page, copy the component inline.

### Alerts / Notifications
- SweetAlert2 is installed globally. Use `alertSuccess`, `alertError`, `alertConfirmDelete` from `src/utils/alert.js`.
- Every create/update handler should check `result.error` and call `alertError` before returning; otherwise call `alertSuccess`.
- Every delete handler should call `alertConfirmDelete` first, then dispatch, then `alertSuccess`. No inline DeleteModal needed.
- Settings save and clear data actions also use the same alert pattern.

### General
- When the user says "change X to Y", check if it's a rename (update references everywhere) vs. a functional change (rebuild the feature). Ask if unclear.
- Always run `php artisan migrate` immediately after creating a migration to verify it works before moving on.
