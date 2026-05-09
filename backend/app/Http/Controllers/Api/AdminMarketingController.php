<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\MarketingBanner;
use App\Models\MarketingCoupon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AdminMarketingController extends Controller
{
    private function requireAdmin(Request $request): AdminUser
    {
        $u = $request->user();
        if (! $u instanceof AdminUser) {
            abort(403, 'يجب تسجيل الدخول كمسؤول.');
        }

        return $u;
    }

    // ---------------------------
    // Coupons
    // ---------------------------
    public function createCoupon(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:64', 'unique:marketing_coupons,code'],
            'discountPercentage' => ['required', 'integer', 'min:1', 'max:95'],
            'isActive' => ['sometimes', 'boolean'],
            'expiryDate' => ['nullable', 'date'],
        ]);

        $coupon = MarketingCoupon::query()->create([
            'code' => strtoupper(trim((string) $data['code'])),
            'discount_percentage' => (int) $data['discountPercentage'],
            'is_active' => (bool) Arr::get($data, 'isActive', true),
            'expiry_date' => isset($data['expiryDate']) ? $data['expiryDate'] : null,
        ]);

        return response()->json([
            'coupon' => [
                'id' => (string) $coupon->id,
                'code' => (string) $coupon->code,
                'discountPercentage' => (int) $coupon->discount_percentage,
                'isActive' => (bool) $coupon->is_active,
                'expiryDate' => $coupon->expiry_date?->toIso8601String(),
            ],
        ], 201);
    }

    public function updateCoupon(Request $request, string $coupon)
    {
        $this->requireAdmin($request);

        $couponRow = MarketingCoupon::query()->findOrFail($coupon);

        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:64', 'unique:marketing_coupons,code,' . $couponRow->id . ',id'],
            'discountPercentage' => ['sometimes', 'integer', 'min:1', 'max:95'],
            'isActive' => ['sometimes', 'boolean'],
            'expiryDate' => ['nullable', 'date'],
        ]);

        if (array_key_exists('code', $data)) {
            $couponRow->code = strtoupper(trim((string) $data['code']));
        }
        if (array_key_exists('discountPercentage', $data)) {
            $couponRow->discount_percentage = (int) $data['discountPercentage'];
        }
        if (array_key_exists('isActive', $data)) {
            $couponRow->is_active = (bool) $data['isActive'];
        }
        if (array_key_exists('expiryDate', $data)) {
            $couponRow->expiry_date = isset($data['expiryDate']) ? $data['expiryDate'] : null;
        }

        $couponRow->save();

        return response()->json([
            'coupon' => [
                'id' => (string) $couponRow->id,
                'code' => (string) $couponRow->code,
                'discountPercentage' => (int) $couponRow->discount_percentage,
                'isActive' => (bool) $couponRow->is_active,
                'expiryDate' => $couponRow->expiry_date?->toIso8601String(),
            ],
        ]);
    }

    public function deleteCoupon(Request $request, string $coupon)
    {
        $this->requireAdmin($request);

        MarketingCoupon::query()->where('id', $coupon)->delete();

        return response()->json(['ok' => true]);
    }

    // ---------------------------
    // Banners
    // ---------------------------
    public function createBanner(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'description' => ['required', 'string'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'ctaText' => ['nullable', 'string', 'max:255'],
            'ctaLink' => ['nullable', 'string', 'max:2048'],
            'isActive' => ['sometimes', 'boolean'],
            'expiryDate' => ['nullable', 'date'],
            'type' => ['sometimes', 'string', 'in:popup,banner'],
            'relatedCouponCode' => ['nullable', 'string', 'max:64'],
            'backgroundColor' => ['nullable', 'string', 'max:32'],
            'textColor' => ['nullable', 'string', 'max:32'],
        ]);

        $banner = MarketingBanner::query()->create([
            'title' => $data['title'],
            'description' => $data['description'],
            'emoji' => Arr::get($data, 'emoji'),
            'cta_text' => Arr::get($data, 'ctaText'),
            'cta_link' => Arr::get($data, 'ctaLink'),
            'is_active' => (bool) Arr::get($data, 'isActive', true),
            'expiry_date' => isset($data['expiryDate']) ? $data['expiryDate'] : null,
            'type' => Arr::get($data, 'type', 'popup'),
            'related_coupon_code' => Arr::get($data, 'relatedCouponCode'),
            'background_color' => Arr::get($data, 'backgroundColor'),
            'text_color' => Arr::get($data, 'textColor'),
        ]);

        return response()->json([
            'banner' => [
                'id' => (string) $banner->id,
                'title' => (string) $banner->title,
                'description' => (string) $banner->description,
                'emoji' => $banner->emoji,
                'ctaText' => $banner->cta_text,
                'ctaLink' => $banner->cta_link,
                'isActive' => (bool) $banner->is_active,
                'expiryDate' => $banner->expiry_date?->toIso8601String(),
                'type' => (string) $banner->type,
                'relatedCouponCode' => $banner->related_coupon_code,
                'backgroundColor' => $banner->background_color,
                'textColor' => $banner->text_color,
            ],
        ], 201);
    }

    public function updateBanner(Request $request, string $banner)
    {
        $this->requireAdmin($request);

        $bannerRow = MarketingBanner::query()->findOrFail($banner);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'min:2', 'max:255'],
            'description' => ['sometimes', 'string'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'ctaText' => ['nullable', 'string', 'max:255'],
            'ctaLink' => ['nullable', 'string', 'max:2048'],
            'isActive' => ['sometimes', 'boolean'],
            'expiryDate' => ['nullable', 'date'],
            'type' => ['sometimes', 'string', 'in:popup,banner'],
            'relatedCouponCode' => ['nullable', 'string', 'max:64'],
            'backgroundColor' => ['nullable', 'string', 'max:32'],
            'textColor' => ['nullable', 'string', 'max:32'],
        ]);

        foreach ($data as $k => $v) {
            // map camelCase -> snake_case where needed
            switch ($k) {
                case 'ctaText':
                    $bannerRow->cta_text = $v;
                    break;
                case 'ctaLink':
                    $bannerRow->cta_link = $v;
                    break;
                case 'isActive':
                    $bannerRow->is_active = (bool) $v;
                    break;
                case 'expiryDate':
                    $bannerRow->expiry_date = isset($v) ? $v : null;
                    break;
                case 'relatedCouponCode':
                    $bannerRow->related_coupon_code = $v;
                    break;
                case 'backgroundColor':
                    $bannerRow->background_color = $v;
                    break;
                case 'textColor':
                    $bannerRow->text_color = $v;
                    break;
                default:
                    $bannerRow->{$k} = $v;
            }
        }

        $bannerRow->save();

        return response()->json(['banner' => [
            'id' => (string) $bannerRow->id,
            'title' => (string) $bannerRow->title,
            'description' => (string) $bannerRow->description,
            'emoji' => $bannerRow->emoji,
            'ctaText' => $bannerRow->cta_text,
            'ctaLink' => $bannerRow->cta_link,
            'isActive' => (bool) $bannerRow->is_active,
            'expiryDate' => $bannerRow->expiry_date?->toIso8601String(),
            'type' => (string) $bannerRow->type,
            'relatedCouponCode' => $bannerRow->related_coupon_code,
            'backgroundColor' => $bannerRow->background_color,
            'textColor' => $bannerRow->text_color,
        ]]);
    }

    public function deleteBanner(Request $request, string $banner)
    {
        $this->requireAdmin($request);

        MarketingBanner::query()->where('id', $banner)->delete();

        return response()->json(['ok' => true]);
    }
}

