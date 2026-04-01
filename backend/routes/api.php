<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerRegistrationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MobileSubscriptionController;
use App\Http\Controllers\Api\NavigationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SubscriptionPackageController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FontController;
use App\Http\Controllers\Api\FrameController;
use App\Http\Controllers\Api\FrameLayerController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class , 'register']);
Route::post('/login', [AuthController::class , 'login']);

// Customer self-registration
Route::post('/customer/register', [CustomerRegistrationController::class , 'register']);
Route::get('/customer/packages', [CustomerRegistrationController::class , 'packages']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class , 'user']);
    Route::post('/logout', [AuthController::class , 'logout']);

    // Dashboard & Navigation
    Route::get('/dashboard/stats', [DashboardController::class , 'stats']);
    Route::get('/navigation', [NavigationController::class , 'index']);

    // Payments (Razorpay)
    Route::post('/payment/create-order', [PaymentController::class , 'createOrder']);
    Route::post('/payment/verify', [PaymentController::class , 'verify']);
    Route::post('/payment/failed', [PaymentController::class , 'failed']);

    // Mobile App - Subscription Status
    Route::get('/mobile/subscription/status', [MobileSubscriptionController::class , 'status']);
    Route::get('/mobile/subscription/history', [MobileSubscriptionController::class , 'history']);

    // Packages (public list for all authenticated users)
    Route::get('/packages', [SubscriptionPackageController::class , 'index']);

    // Packages Management (Super Admin + Admin)
    Route::middleware('role:super_admin,admin')->group(function () {
            Route::post('/packages', [SubscriptionPackageController::class , 'store']);
            Route::get('/packages/{subscriptionPackage}', [SubscriptionPackageController::class , 'show']);
            Route::put('/packages/{subscriptionPackage}', [SubscriptionPackageController::class , 'update']);
            Route::delete('/packages/{subscriptionPackage}', [SubscriptionPackageController::class , 'destroy']);
            Route::patch('/packages/{subscriptionPackage}/toggle', [SubscriptionPackageController::class , 'toggleActive']);
        }
        );

        // Roles (Super Admin only)
        Route::middleware('role:super_admin')->group(function () {
            Route::apiResource('roles', RoleController::class);
            Route::post('/roles/{role}/permissions', [RoleController::class , 'assignPermissions']);
        }
        );

        // Permissions (Super Admin only)
        Route::middleware('role:super_admin')->group(function () {
            Route::apiResource('permissions', PermissionController::class);
        }
        );

        // Users (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::apiResource('users', UserController::class);
        }
        );

        // Customers (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::apiResource('customers', CustomerController::class);
        }
        );

        // Categories (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::get('/categories/flat', [CategoryController::class, 'flat']);
            Route::apiResource('categories', CategoryController::class);
        }
        );

        // Frames (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::apiResource('frames', FrameController::class);
            Route::patch('/frames/{frame}/toggle', [FrameController::class, 'toggleActive']);
        }
        );

        // Frame Layers (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::apiResource('frame-layers', FrameLayerController::class);
            Route::patch('/frame-layers/{frameLayer}/toggle', [FrameLayerController::class, 'toggleActive']);
        }
        );

        // Settings (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::get('/settings', [SettingsController::class, 'index']);
            Route::post('/settings', [SettingsController::class, 'update']);
            Route::post('/settings/clear-data', [SettingsController::class, 'clearAppData']);
        }
        );

        // Fonts (Super Admin + Admin)
        Route::middleware('role:super_admin,admin')->group(function () {
            Route::apiResource('fonts', FontController::class);
            Route::patch('/fonts/{font}/toggle', [FontController::class, 'toggleActive']);
            Route::patch('/fonts/{font}/default', [FontController::class, 'setDefault']);
        }
        );
    });
