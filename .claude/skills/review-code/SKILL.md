---
name: review-code
description: Run a quick quality review on recently changed files — checks registrations, cross-references, and common mistakes
argument-hint: "[file-or-feature] (optional, defaults to recent changes)"
user-invocable: true
context: fork
agent: Explore
---

# Code Review: $ARGUMENTS

Run a quality check on the specified file/feature (or recent git changes if none specified).

## Checks to Perform

### 1. Backend Consistency
- Every column in migration exists in model `$fillable`
- JSON columns have `'column' => 'array'` in `casts()`
- Controller validation keys match FormData field names from frontend
- Routes in `api.php` match controller method names
- File upload field name matches between frontend FormData and controller `$request->file()`

### 2. Frontend Consistency
- Redux slice registered in `src/app/store.js`
- Page imported and routed in `src/App.jsx`
- `useSelector` key matches the store reducer name
- Thunk API URLs match `routes/api.php` endpoints
- Navigation icon name exists in `Sidebar.jsx` icon map

### 3. Common Mistakes
- Missing `_method: PUT` in FormData for update thunks
- Forgotten `per_page` param when fetching all records for dropdowns
- File not deleted from storage before replacement on update
- Toggle endpoint missing from routes

## Output
List issues found with file paths, line numbers, and severity (Critical/Important/Minor).
If no issues found, confirm "All checks passed."
