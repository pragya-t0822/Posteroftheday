---
name: create-crud
description: Scaffold a full CRUD feature — migration, model, controller, routes, Redux slice, page, and navigation entry
argument-hint: "[feature-name] e.g. banners, templates, fonts"
user-invocable: true
---

# Create Full CRUD Feature: $ARGUMENTS

Scaffold the complete stack for a new **$ARGUMENTS** module. Follow the project conventions exactly.

## Step 1: Backend — Migration
Create `backend/database/migrations/<timestamp>_create_<table>_table.php`:
- `id()`, standard columns, `timestamps()`
- Foreign keys with `->constrained()->cascadeOnDelete()`
- Indexes on FKs, `is_active`, search columns
- Run `php artisan migrate` immediately

## Step 2: Backend — Model
Create `backend/app/Models/<Model>.php`:
- `$fillable` array with all columns
- `casts()` for booleans, integers, JSON
- Relationships: `belongsTo`, `hasMany` as needed

## Step 3: Backend — Translation Model (if multilingual)
Create `backend/app/Models/<Model>Translation.php`:
- `$fillable`: `['<model>_id', 'language', 'title']`
- `belongsTo` relationship back to parent

## Step 4: Backend — Controller
Create `backend/app/Http/Controllers/Api/<Model>Controller.php`:
- `index()` with server-side search, filters, pagination
- `store()` with validation, file upload if needed, return 201
- `show()` with eager loading
- `update()` with file replacement logic
- `destroy()` with file cleanup
- `toggleActive()` for status toggle
- `syncTranslations()` private helper if multilingual

## Step 5: Backend — Routes
Add to `backend/routes/api.php`:
```php
Route::middleware('role:super_admin,admin')->group(function () {
    Route::apiResource('<route-name>', <Model>Controller::class);
    Route::patch('/<route-name>/{<model>}/toggle', [<Model>Controller::class, 'toggleActive']);
});
```

## Step 6: Frontend — Redux Slice
Create `frontend/src/features/<feature>/<feature>Slice.js`:
- Thunks: `fetch`, `create`, `update`, `delete`, `toggle`
- Standard state: `{ items, pagination, loading, error }`
- Register in `frontend/src/app/store.js`

## Step 7: Frontend — Page
Create `frontend/src/pages/<feature>/<Page>.jsx`:
- Header: title, subtitle, "Add" button
- Search bar + filter dropdowns
- Table with columns matching the model
- Status badges (Active/Inactive)
- Action icons: View, Edit, Download, Delete
- Modals: Create/Edit, Preview, Delete confirmation
- Pagination with Previous/Next

## Step 8: Frontend — Routing & Navigation
- Import and add route in `frontend/src/App.jsx`
- Add icon to `Sidebar.jsx` icon map
- Update `NavigationSeeder.php`
- Update DB navigation row via tinker

## Step 9: Verify
- Migration ran cleanly
- Slice registered in store
- Route in App.jsx
- Navigation icon mapped
