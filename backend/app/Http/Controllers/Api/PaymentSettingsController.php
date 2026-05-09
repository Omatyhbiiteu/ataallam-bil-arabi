<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;

class PaymentSettingsController extends Controller
{
    /**
     * إعدادات الدفع للمستخدمين (بدون أسرار حساسة).
     */
    public function public()
    {
        $row = PaymentSetting::query()->first();
        $payload = $row?->payload;

        if (! is_array($payload)) {
            return response()->json(['settings' => null]);
        }

        unset($payload['stripeSecretKey']);

        return response()->json(['settings' => $payload]);
    }

    /**
     * إعدادات كاملة للمسئول (يشمل مفاتيح Stripe المحفوظة).
     */
    public function adminShow(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $row = PaymentSetting::query()->first();

        return response()->json(['settings' => $row?->payload]);
    }

    public function adminUpdate(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $settings = $data['settings'];
        $encoded = json_encode($settings);
        if ($encoded === false || strlen($encoded) > 512_000) {
            return response()->json(['message' => 'حجم الإعدادات كبير جداً'], 422);
        }

        $row = PaymentSetting::query()->first();
        if ($row) {
            $row->update(['payload' => $settings]);
        } else {
            PaymentSetting::query()->create(['payload' => $settings]);
        }

        return response()->json([
            'ok' => true,
            'settings' => PaymentSetting::query()->first()?->payload,
        ]);
    }
}
