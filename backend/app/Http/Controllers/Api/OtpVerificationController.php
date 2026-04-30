<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhoneOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpVerificationController extends Controller
{
    /**
     * Generate and send OTP to the given phone number via WhatsApp.
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        $phone = $request->phone;

        // Check if phone is already registered
        if (User::where('phone', $phone)->exists()) {
            return response()->json([
                'message' => 'This phone number is already registered.',
            ], 422);
        }

        // Rate limit: prevent sending OTP more than once per minute
        $recentOtp = PhoneOtp::where('phone', $phone)
            ->where('created_at', '>=', now()->subMinute())
            ->first();

        if ($recentOtp) {
            return response()->json([
                'message' => 'OTP already sent. Please wait before requesting a new one.',
            ], 429);
        }

        // Delete old OTPs for this phone
        PhoneOtp::where('phone', $phone)->delete();

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store hashed OTP with 10-minute expiry
        PhoneOtp::create([
            'phone' => $phone,
            'otp' => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
        ]);

        // Send OTP via WhatsApp API
        try {
            $response = Http::get(config('services.whatsapp.api_url'), [
                'token' => config('services.whatsapp.token'),
                'phone' => '+' . $phone,
                'message' => "Your Poster of the Day verification code is: {$otp}. This code expires in 10 minutes. Do not share it with anyone.",
            ]);

            $body = $response->json();
            if (!$response->successful() || (isset($body['status']) && !in_array($body['status'], ['200', 'success']))) {
                Log::error('WhatsApp OTP send failed', [
                    'phone' => $phone,
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);

                $apiMessage = $body['message'] ?? 'Failed to send OTP.';

                return response()->json([
                    'message' => $apiMessage,
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp OTP exception', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to send OTP. Please try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'OTP sent successfully to your WhatsApp.',
        ]);
    }

    /**
     * Verify the OTP entered by the user.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'otp' => 'required|string|size:6',
        ]);

        $otpRecord = PhoneOtp::where('phone', $request->phone)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'message' => 'No OTP found for this phone number. Please request a new one.',
            ], 422);
        }

        if ($otpRecord->isExpired()) {
            $otpRecord->delete();

            return response()->json([
                'message' => 'OTP has expired. Please request a new one.',
            ], 422);
        }

        if (!Hash::check($request->otp, $otpRecord->otp)) {
            return response()->json([
                'message' => 'Invalid OTP. Please try again.',
            ], 422);
        }

        // Mark as verified
        $otpRecord->update(['verified' => true]);

        return response()->json([
            'message' => 'Phone number verified successfully.',
            'verified' => true,
        ]);
    }

    /**
     * Normalize phone: strips +91 or 91 prefix, returns 10-digit number.
     * Also returns the original for fallback matching.
     */
    private function resolveUser(string $phone): ?User
    {
        // Try exact match first
        $user = User::whereHas('role', fn ($q) => $q->where('slug', 'customer'))
            ->where('phone', $phone)
            ->first();

        if ($user) return $user;

        // Try stripping country code variants: +91XXXXXXXXXX or 91XXXXXXXXXX → XXXXXXXXXX
        $stripped = preg_replace('/^(\+91|91)/', '', $phone);
        if ($stripped !== $phone) {
            $user = User::whereHas('role', fn ($q) => $q->where('slug', 'customer'))
                ->where('phone', $stripped)
                ->first();
        }

        return $user;
    }

    /**
     * Send OTP for login — phone must be registered.
     */
    public function sendLoginOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        $phone = $request->phone;

        // Check if phone is registered as a customer (handles format variants)
        $user = $this->resolveUser($phone);

        if (!$user) {
            return response()->json([
                'message' => 'No account found with this phone number.',
            ], 422);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is inactive. Please contact support.',
            ], 422);
        }

        // Rate limit: 1 OTP per minute
        $recentOtp = PhoneOtp::where('phone', $phone)
            ->where('created_at', '>=', now()->subMinute())
            ->first();

        if ($recentOtp) {
            return response()->json([
                'message' => 'OTP already sent. Please wait before requesting a new one.',
            ], 429);
        }

        // Delete old OTPs for this phone
        PhoneOtp::where('phone', $phone)->delete();

        // Generate 6-digit OTP with 5-minute expiry
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PhoneOtp::create([
            'phone' => $phone,
            'otp' => Hash::make($otp),
            'expires_at' => now()->addMinutes(5),
        ]);

        // Send via WhatsApp
        try {
            $response = Http::get(config('services.whatsapp.api_url'), [
                'token' => config('services.whatsapp.token'),
                'phone' => '+' . $phone,
                'message' => "Your Poster of the Day login OTP is: {$otp}. This code expires in 5 minutes. Do not share it with anyone.",
            ]);

            $body = $response->json();
            if (!$response->successful() || (isset($body['status']) && !in_array($body['status'], ['200', 'success']))) {
                Log::error('WhatsApp login OTP send failed', [
                    'phone' => $phone,
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'message' => $body['message'] ?? 'Failed to send OTP.',
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp login OTP exception', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to send OTP. Please try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'OTP sent successfully to your WhatsApp.',
        ]);
    }

    /**
     * Verify login OTP and authenticate the user.
     */
    public function verifyLoginOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'otp' => 'required|string|size:6',
        ]);

        $otpRecord = PhoneOtp::where('phone', $request->phone)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'message' => 'No OTP found. Please request a new one.',
            ], 422);
        }

        if ($otpRecord->isExpired()) {
            $otpRecord->delete();

            return response()->json([
                'message' => 'OTP has expired. Please request a new one.',
            ], 422);
        }

        if (!Hash::check($request->otp, $otpRecord->otp)) {
            return response()->json([
                'message' => 'Invalid OTP. Please try again.',
            ], 422);
        }

        // OTP is valid — clean up and authenticate
        PhoneOtp::where('phone', $request->phone)->delete();

        $user = $this->resolveUser($request->phone);
        if ($user && $user->status !== 'active') $user = null;

        if (!$user) {
            return response()->json([
                'message' => 'Account not found or inactive.',
            ], 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role.permissions');

        return response()->json([
            'user' => $user,
            'token' => $token,
            'permissions' => $user->role ? $user->role->permissions->pluck('slug') : [],
        ]);
    }
}
