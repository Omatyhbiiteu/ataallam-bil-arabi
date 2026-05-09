<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketingCoupon;
use App\Models\PaymentSession;
use App\Models\User;
use Illuminate\Http\Request;

class PaymentsController extends Controller
{
    public function verifyCoupon(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ]);

        $code = strtoupper(trim((string) $data['code']));
        $now = now();

        $coupon = MarketingCoupon::query()
            ->where('code', $code)
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now);
            })
            ->first();

        if (! $coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'الكود ده غير متاح حاليا',
            ]);
        }

        return response()->json([
            'valid' => true,
            'discountPercentage' => (int) $coupon->discount_percentage,
            'expiryDate' => $coupon->expiry_date?->toIso8601String(),
        ]);
    }

    public function createSession(Request $request)
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        $data = $request->validate([
            'planId' => ['required', 'string', 'max:128'],
            'planPrice' => ['required', 'numeric', 'min:1'],
            'couponCode' => ['nullable', 'string', 'max:64'],
            'paymentMethod' => ['nullable', 'string', 'max:64'],
        ]);

        $planPrice = (float) $data['planPrice'];
        $couponCode = $data['couponCode'] ? strtoupper(trim((string) $data['couponCode'])) : null;

        $discountPercentage = null;
        $discountAmount = 0.0;

        if ($couponCode) {
            $coupon = MarketingCoupon::query()
                ->where('code', $couponCode)
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', now());
                })
                ->first();

            if (! $coupon) {
                return response()->json([
                    'ok' => false,
                    'message' => 'الكود ده غير متاح حاليا',
                ], 422);
            }

            $discountPercentage = (int) $coupon->discount_percentage;
            $discountAmount = round($planPrice * ($discountPercentage / 100), 2);
        }

        $finalAmount = round(max(0, $planPrice - $discountAmount), 2);

        $session = PaymentSession::query()->create([
            'user_id' => $user->id,
            'plan_id' => $data['planId'],
            'original_amount' => $planPrice,
            'discount_amount' => $discountAmount,
            'final_amount' => $finalAmount,
            'coupon_code' => $couponCode,
            'payment_method' => $data['paymentMethod'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'ok' => true,
            'payment' => [
                'id' => (string) $session->id,
                'planId' => (string) $session->plan_id,
                'originalAmount' => (float) $session->original_amount,
                'discountAmount' => (float) $session->discount_amount,
                'finalAmount' => (float) $session->final_amount,
                'discountPercentage' => $discountPercentage,
                'couponCode' => $session->coupon_code,
            ],
        ]);
    }
}

