---
name: create-migration
description: Generate a Laravel migration following project conventions, then run it immediately
argument-hint: "[description] e.g. add_status_to_frame_layers, create_banners_table"
user-invocable: true
---

# Create Migration: $ARGUMENTS

Generate a Laravel database migration for: **$ARGUMENTS**

## Rules
1. Place in `backend/database/migrations/` with today's date timestamp
2. For new tables (`create_*`):
   - Always include `$table->id()` and `$table->timestamps()`
   - Add `$table->foreignId(...)->constrained()->cascadeOnDelete()` for FKs
   - Add `$table->index(...)` on FKs, booleans, and search columns
   - Include `$table->boolean('is_active')->default(true)` if applicable
   - Include `$table->integer('sort_order')->default(0)` if sortable
3. For alterations (`add_*_to_*`):
   - Use `Schema::table()` not `Schema::create()`
   - Place new columns logically with `->after('column')`
   - `down()` must reverse the change with `dropColumn()`
4. After creating the file, immediately run:
   ```bash
   cd backend && php artisan migrate
   ```
5. Then remind to update the Model's `$fillable` and `casts()` arrays
