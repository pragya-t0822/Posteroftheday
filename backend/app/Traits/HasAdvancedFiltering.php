<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait HasAdvancedFiltering
{
    /**
     * Apply search across multiple fields.
     */
    protected function applySearch(Builder $query, Request $request, array $searchFields): Builder
    {
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search, $searchFields) {
                foreach ($searchFields as $field) {
                    if (str_contains($field, '.')) {
                        // Relationship search: "relation.field"
                        [$relation, $relField] = explode('.', $field, 2);
                        $q->orWhereHas($relation, fn($rq) => $rq->where($relField, 'like', "%{$search}%"));
                    } else {
                        $q->orWhere($field, 'like', "%{$search}%");
                    }
                }
            });
        }
        return $query;
    }

    /**
     * Apply exact-match filters (status, type, category_id, etc.).
     */
    protected function applyFilters(Builder $query, Request $request, array $filterMap): Builder
    {
        foreach ($filterMap as $param => $column) {
            if ($value = $request->input($param)) {
                if (str_contains($column, '.')) {
                    [$relation, $relField] = explode('.', $column, 2);
                    $query->whereHas($relation, fn($q) => $q->where($relField, $value));
                } else {
                    $query->where($column, $value);
                }
            }
        }
        return $query;
    }

    /**
     * Apply date range filtering.
     */
    protected function applyDateRange(Builder $query, Request $request, string $dateField = 'created_at'): Builder
    {
        if ($from = $request->input('date_from')) {
            $query->whereDate($dateField, '>=', $from);
        }
        if ($to = $request->input('date_to')) {
            $query->whereDate($dateField, '<=', $to);
        }
        return $query;
    }

    /**
     * Bulk update a status/active field.
     */
    protected function bulkUpdateField(string $modelClass, Request $request, string $field, $value): \Illuminate\Http\JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = $modelClass::whereIn('id', $request->input('ids'))->update([$field => $value]);
        return response()->json(['message' => "{$count} record(s) updated", 'count' => $count]);
    }

    /**
     * Bulk delete records.
     */
    protected function bulkDestroy(string $modelClass, Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = $modelClass::whereIn('id', $request->input('ids'))->delete();
        return response()->json(['message' => "{$count} record(s) deleted", 'count' => $count]);
    }

    /**
     * Export records as CSV download.
     */
    protected function exportCsv(string $modelClass, Request $request, array $columns, array $headers, string $filename, array $relations = []): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $request->validate(['ids' => 'nullable|array', 'ids.*' => 'integer']);

        $query = $modelClass::query();
        if (!empty($relations)) {
            $query->with($relations);
        }
        if ($ids = $request->input('ids')) {
            $query->whereIn('id', $ids);
        }
        $records = $query->orderByDesc('created_at')->get();

        return response()->streamDownload(function () use ($records, $columns, $headers) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($records as $record) {
                $row = [];
                foreach ($columns as $col) {
                    if (str_contains($col, '.')) {
                        $row[] = data_get($record, $col, '');
                    } else {
                        $row[] = $record->{$col} ?? '';
                    }
                }
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
