<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhoneOtp;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerRegistrationController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'package_id' => 'required|exists:subscription_packages,id',
            'referral_code' => 'nullable|string|exists:users,referral_code',
        ]);

        // Ensure phone number has been verified via OTP
        $verifiedOtp = PhoneOtp::where('phone', $request->phone)
            ->where('verified', true)
            ->first();

        if (!$verifiedOtp) {
            return response()->json([
                'message' => 'Phone number must be verified before registration.',
            ], 422);
        }

        // Clean up used OTP records
        PhoneOtp::where('phone', $request->phone)->delete();

        $customerRole = Role::where('slug', 'customer')->firstOrFail();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password,
            'status' => 'active',
            'role_id' => $customerRole->id,
        ]);

        // Generate unique referral code for this customer
        do {
            $code = strtoupper(\Illuminate\Support\Str::random(8));
        } while (User::where('referral_code', $code)->exists());
        $user->update(['referral_code' => $code]);

        // If referred by someone, create referral record
        if ($request->filled('referral_code')) {
            $referrer = User::where('referral_code', $request->referral_code)->first();
            if ($referrer) {
                $user->update(['referred_by' => $referrer->id]);
                \App\Models\Referral::create([
                    'referrer_id' => $referrer->id,
                    'referred_id' => $user->id,
                    'referral_code' => $request->referral_code,
                    'status' => 'pending',
                ]);
            }
        }

        $package = SubscriptionPackage::findOrFail($request->package_id);

        // Create pending subscription
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'subscription_package_id' => $package->id,
            'status' => $package->price <= 0 ? 'active' : 'pending',
            'starts_at' => $package->price <= 0 ? now() : null,
            'ends_at' => $package->price <= 0 ? now()->addDays($package->duration_days) : null,
            'is_premium' => $package->price <= 0 ? false : false,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role.permissions');

        return response()->json([
            'user' => $user,
            'token' => $token,
            'subscription' => $subscription->load('package'),
            'requires_payment' => $package->price > 0,
            'permissions' => $user->role ? $user->role->permissions->pluck('slug') : [],
        ], 201);
    }

    public function packages()
    {
        return response()->json(
            SubscriptionPackage::where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('price')
                ->get()
        );
    }
}
