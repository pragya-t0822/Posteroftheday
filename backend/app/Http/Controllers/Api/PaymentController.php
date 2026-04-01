<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Razorpay\Api\Api;

class PaymentController extends Controller
{
    private function getRazorpay(): Api
    {
        return new Api(config('razorpay.key_id'), config('razorpay.key_secret'));
    }

    public function createOrder(Request $request)
    {
        $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
        ]);

        $subscription = Subscription::with('package')->findOrFail($request->subscription_id);

        if ($subscription->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($subscription->status === 'active') {
            return response()->json(['message' => 'Subscription already active'], 400);
        }

        $amountInPaise = (int) round($subscription->package->price * 100);

        $razorpay = $this->getRazorpay();
        $order = $razorpay->order->create([
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'receipt' => 'sub_' . $subscription->id . '_' . time(),
            'notes' => [
                'subscription_id' => $subscription->id,
                'user_id' => $request->user()->id,
                'package' => $subscription->package->name,
            ],
        ]);

        $payment = Payment::create([
            'user_id' => $request->user()->id,
            'subscription_id' => $subscription->id,
            'razorpay_order_id' => $order->id,
            'amount' => $subscription->package->price,
            'currency' => 'INR',
            'status' => 'created',
        ]);

        return response()->json([
            'order_id' => $order->id,
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'key_id' => config('razorpay.key_id'),
            'payment_id' => $payment->id,
            'user' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
            'package_name' => $subscription->package->name,
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $payment = Payment::where('razorpay_order_id', $request->razorpay_order_id)->firstOrFail();

        if ($payment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify signature
        $razorpay = $this->getRazorpay();
        $attributes = [
            'razorpay_order_id' => $request->razorpay_order_id,
            'razorpay_payment_id' => $request->razorpay_payment_id,
            'razorpay_signature' => $request->razorpay_signature,
        ];

        try {
            $razorpay->utility->verifyPaymentSignature($attributes);
        } catch (\Exception $e) {
            $payment->update([
                'status' => 'failed',
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'meta' => ['error' => $e->getMessage()],
            ]);

            return response()->json(['message' => 'Payment verification failed', 'status' => 'failed'], 400);
        }

        // Payment verified — activate subscription
        $payment->update([
            'razorpay_payment_id' => $request->razorpay_payment_id,
            'razorpay_signature' => $request->razorpay_signature,
            'status' => 'paid',
        ]);

        $subscription = $payment->subscription;
        $subscription->update([
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays($subscription->package->duration_days),
            'is_premium' => true,
        ]);

        return response()->json([
            'message' => 'Payment successful! Your premium access is now active.',
            'status' => 'paid',
            'subscription' => $subscription->load('package'),
        ]);
    }

    public function failed(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required|string',
            'error_description' => 'nullable|string',
        ]);

        $payment = Payment::where('razorpay_order_id', $request->razorpay_order_id)->first();

        if ($payment) {
            $payment->update([
                'status' => 'failed',
                'meta' => ['error' => $request->error_description],
            ]);
        }

        return response()->json(['message' => 'Payment failed', 'status' => 'failed']);
    }
}
