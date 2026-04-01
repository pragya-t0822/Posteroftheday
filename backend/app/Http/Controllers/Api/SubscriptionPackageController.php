<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPackage;
use Illuminate\Http\Request;

class SubscriptionPackageController extends Controller
{
    public function index()
    {
        return response()->json(
            SubscriptionPackage::orderBy('sort_order')->orderBy('price')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_packages',
            'duration_type' => 'required|in:monthly,quarterly,half_yearly,yearly',
            'duration_days' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*' => 'string',
            'is_popular' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $package = SubscriptionPackage::create($request->all());

        return response()->json($package, 201);
    }

    public function show(SubscriptionPackage $subscriptionPackage)
    {
        return response()->json($subscriptionPackage);
    }

    public function update(Request $request, SubscriptionPackage $subscriptionPackage)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:subscription_packages,slug,' . $subscriptionPackage->id,
            'duration_type' => 'sometimes|in:monthly,quarterly,half_yearly,yearly',
            'duration_days' => 'sometimes|integer|min:1',
            'price' => 'sometimes|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*' => 'string',
            'is_popular' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $subscriptionPackage->update($request->all());

        return response()->json($subscriptionPackage);
    }

    public function destroy(SubscriptionPackage $subscriptionPackage)
    {
        $subscriptionPackage->delete();

        return response()->json(['message' => 'Package deleted']);
    }

    public function toggleActive(SubscriptionPackage $subscriptionPackage)
    {
        $subscriptionPackage->update(['is_active' => !$subscriptionPackage->is_active]);

        return response()->json($subscriptionPackage);
    }
}
