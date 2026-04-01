---
name: test-api
description: Test Laravel API endpoints by reading routes, controller logic, and validation rules — reports issues without hitting the server
argument-hint: "[ControllerName] e.g. FrameLayerController"
user-invocable: true
context: fork
agent: Explore
---

# API Audit: $ARGUMENTS

Perform a static analysis of the specified controller and its related files.

## What to Analyze

### 1. Read the Controller
- File: `backend/app/Http/Controllers/Api/$ARGUMENTS.php`
- Check every public method (index, store, show, update, destroy, toggleActive)

### 2. Validate Route Registration
- Read `backend/routes/api.php`
- Confirm `apiResource` or individual routes exist for this controller
- Confirm middleware groups are correct (`auth:sanctum`, `role:super_admin,admin`)

### 3. Check Model Alignment
- Read the related Model file
- Verify `$fillable` includes all columns the controller writes to
- Verify `casts()` matches column types
- Verify relationships used in controller `->with([...])` are defined

### 4. Check Validation Rules
- Every `store()` required field is validated
- Every `update()` uses `sometimes` for optional fields
- Unique rules include `$model->id` exclusion on update
- File rules include `mimes` and `max` size

### 5. Check Error Handling
- File deletion before replacement on update
- File deletion on destroy
- Translation sync handles null/empty gracefully

## Output
```
[PASS] Description
[FAIL] Description — What's wrong — Suggested fix
```
