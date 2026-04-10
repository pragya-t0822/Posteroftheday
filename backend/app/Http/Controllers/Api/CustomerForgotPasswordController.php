<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetOtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class CustomerForgotPasswordController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
        ]);

        $user = User::with('role')->where('email', $request->email)->first();

        if (! $user || ! $user->role || $user->role->slug !== 'customer') {
            return response()->json([
                'message' => 'If this email is registered as a customer, you will receive an OTP shortly.',
            ]);
        }

        // Delete old OTPs for this email
        PasswordResetOtp::where('email', $request->email)->delete();

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PasswordResetOtp::create([
            'email'      => $request->email,
            'otp'        => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($request->email)->send(new PasswordResetOtpMail($otp, $user->name));

        return response()->json([
            'message' => 'If this email is registered as a customer, you will receive an OTP shortly.',
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'otp'   => 'required|string|size:6',
        ]);

        $record = PasswordResetOtp::where('email', $request->email)
            ->where('verified', false)
            ->latest()
            ->first();

        if (! $record) {
            return response()->json(['message' => 'No OTP request found. Please request a new OTP.'], 422);
        }

        if ($record->isExpired()) {
            $record->delete();
            return response()->json(['message' => 'OTP has expired. Please request a new one.'], 422);
        }

        if (! Hash::check($request->otp, $record->otp)) {
            return response()->json(['message' => 'Invalid OTP. Please try again.'], 422);
        }

        $record->update(['verified' => true]);

        return response()->json(['message' => 'OTP verified successfully.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|string|email',
            'otp'      => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = PasswordResetOtp::where('email', $request->email)
            ->where('verified', true)
            ->latest()
            ->first();

        if (! $record) {
            return response()->json(['message' => 'OTP not verified. Please start over.'], 422);
        }

        if ($record->isExpired()) {
            $record->delete();
            return response()->json(['message' => 'Session expired. Please request a new OTP.'], 422);
        }

        if (! Hash::check($request->otp, $record->otp)) {
            return response()->json(['message' => 'Invalid request. Please start over.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['password' => $request->password]);

        // Clean up all OTP records for this email
        PasswordResetOtp::where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully. You can now log in with your new password.']);
    }
}
