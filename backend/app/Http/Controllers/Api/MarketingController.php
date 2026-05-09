<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketingBanner;
use App\Models\MarketingCoupon;
use App\Models\InspirationalSlide;
use Illuminate\Http\Request;

class MarketingController extends Controller
{
    public function coupons(Request $request)
    {
        $now = now();

        $coupons = MarketingCoupon::query()
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now);
            })
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get();

        return response()->json([
            'coupons' => $coupons->map(fn (MarketingCoupon $c) => [
                'id' => (string) $c->id,
                'code' => (string) $c->code,
                'discountPercentage' => (int) $c->discount_percentage,
                'isActive' => (bool) $c->is_active,
                'expiryDate' => $c->expiry_date?->toIso8601String(),
            ])->values()->all(),
        ]);
    }

    public function banners(Request $request)
    {
        $banners = MarketingBanner::query()
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get();

        return response()->json([
            'banners' => $banners->map(fn (MarketingBanner $b) => [
                'id' => (string) $b->id,
                'title' => $b->title,
                'description' => $b->description,
                'emoji' => $b->emoji,
                'ctaText' => $b->cta_text,
                'ctaLink' => $b->cta_link,
                'isActive' => (bool) $b->is_active,
                'expiryDate' => $b->expiry_date?->toIso8601String(),
                'type' => $b->type,
                'relatedCouponCode' => $b->related_coupon_code,
                'backgroundColor' => $b->background_color,
                'textColor' => $b->text_color,
            ])->values()->all(),
        ]);
    }

    public function inspirational(Request $request)
    {
        $slides = InspirationalSlide::query()
            ->where('is_active', true)
            ->orderByRaw('sort_order is null') // non-null first
            ->orderBy('sort_order')
            ->orderByDesc('updated_at')
            ->limit(200)
            ->get();

        return response()->json([
            'slides' => $slides->map(fn (InspirationalSlide $s) => [
                'id' => (string) $s->id,
                'text' => (string) $s->text,
                'source' => (string) $s->source,
                'gradient' => (string) $s->gradient,
                'icon' => (string) $s->icon,
                'createdAt' => $s->created_at ? (int) ($s->created_at->getTimestamp() * 1000) : 0,
            ])->values()->all(),
        ]);
    }
}

