<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CardImageAsset;
use App\Models\User;
use App\Models\UserFeatureUsage;
use App\Support\CardImageTermNormalizer;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class UserCardImageAssetController extends Controller
{
    private const FEATURE = 'card_image_asset_use';
    private const SILVER_LIMIT = 15;

    private function appUser(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        return $user;
    }

    public function search(Request $request)
    {
        $user = $this->appUser($request);
        $data = $request->validate([
            'lang' => ['required', 'string', 'in:en,de'],
            'q' => ['required', 'string', 'max:255'],
        ]);

        $quota = $this->quotaStatus($user, true);
        if (! $quota['allowed']) {
            return response()->json([
                'message' => $quota['message'],
                'quota' => $quota,
                'assets' => [],
            ], $quota['status']);
        }

        $normalized = CardImageTermNormalizer::normalize($data['q']);
        $variants = CardImageTermNormalizer::variants($data['q']);

        $assets = CardImageAsset::query()
            ->where('lang', $data['lang'])
            ->where('is_active', true)
            ->whereHas('terms', function ($q) use ($data, $normalized, $variants) {
                $q->whereIn('lang', ['ar', $data['lang']])
                    ->where(function ($w) use ($normalized, $variants) {
                        $w->whereIn('term_normalized', $variants);
                        if ($normalized !== '') {
                            $w->orWhere('term_normalized', 'like', '%'.$normalized.'%');
                        }
                    });
            })
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get();

        return response()->json([
            'assets' => $assets->map(fn (CardImageAsset $asset) => $this->mapAsset($asset))->values()->all(),
            'quota' => $quota,
        ]);
    }

    public function useAsset(Request $request, string $assetId)
    {
        $user = $this->appUser($request);
        $data = $request->validate([
            'lang' => ['required', 'string', 'in:en,de'],
        ]);

        $asset = CardImageAsset::query()
            ->where('id', $assetId)
            ->where('lang', $data['lang'])
            ->where('is_active', true)
            ->firstOrFail();

        $quota = DB::transaction(function () use ($user) {
            return $this->consumeQuota($user);
        });

        if (! $quota['allowed']) {
            return response()->json([
                'message' => $quota['message'],
                'quota' => $quota,
            ], $quota['status']);
        }

        return response()->json([
            'asset' => $this->mapAsset($asset),
            'quota' => $quota,
        ]);
    }

    private function activePlan(User $user): string
    {
        if (! $user->hasActivePaidPlan()) {
            return 'free';
        }

        $plan = $user->plan ?: 'free';

        return in_array($plan, ['silver', 'pro', 'enterprise'], true) ? $plan : 'free';
    }

    private function quotaStatus(User $user, bool $persistReset = false): array
    {
        $plan = $this->activePlan($user);
        if ($plan === 'pro' || $plan === 'enterprise') {
            return [
                'allowed' => true,
                'status' => 200,
                'plan' => $plan,
                'used' => 0,
                'limit' => null,
                'remaining' => null,
                'resetsAt' => null,
                'secondsRemaining' => 0,
                'message' => null,
            ];
        }

        if ($plan !== 'silver') {
            return [
                'allowed' => false,
                'status' => 403,
                'plan' => 'free',
                'used' => 0,
                'limit' => 0,
                'remaining' => 0,
                'resetsAt' => null,
                'secondsRemaining' => 0,
                'message' => 'ميزة الصور الذكية متاحة لمشتركي سيلفر وبرو. اشترك وخلي بطاقاتك أسهل في الحفظ.',
            ];
        }

        $usage = UserFeatureUsage::query()
            ->where('user_id', $user->id)
            ->where('feature', self::FEATURE)
            ->first();

        if ($usage && $usage->resets_at && $usage->resets_at->isPast()) {
            $usage->count = 0;
            $usage->window_started_at = null;
            $usage->exhausted_at = null;
            $usage->resets_at = null;
            if ($persistReset) {
                $usage->save();
            }
        }

        $used = (int) ($usage?->count ?? 0);
        $resetsAt = $usage?->resets_at;
        $seconds = $resetsAt && $resetsAt->isFuture() ? (int) now()->diffInSeconds($resetsAt) : 0;
        $exhausted = $used >= self::SILVER_LIMIT && $seconds > 0;

        return [
            'allowed' => ! $exhausted,
            'status' => $exhausted ? 429 : 200,
            'plan' => 'silver',
            'used' => min($used, self::SILVER_LIMIT),
            'limit' => self::SILVER_LIMIT,
            'remaining' => max(0, self::SILVER_LIMIT - $used),
            'resetsAt' => $resetsAt?->toISOString(),
            'secondsRemaining' => $seconds,
            'message' => $exhausted
                ? 'استهلكت 15 صورة ذكية في باقة سيلفر. هتتجدد الميزة بعد انتهاء العداد.'
                : null,
        ];
    }

    private function consumeQuota(User $user): array
    {
        $plan = $this->activePlan($user);
        if ($plan === 'pro' || $plan === 'enterprise') {
            return $this->quotaStatus($user);
        }

        if ($plan !== 'silver') {
            return $this->quotaStatus($user);
        }

        $usage = UserFeatureUsage::query()
            ->where('user_id', $user->id)
            ->where('feature', self::FEATURE)
            ->lockForUpdate()
            ->first();

        if (! $usage) {
            try {
                UserFeatureUsage::query()->create([
                    'user_id' => $user->id,
                    'feature' => self::FEATURE,
                    'count' => 0,
                    'window_started_at' => now(),
                ]);
            } catch (QueryException) {
                // A parallel request may have created the row between the read and insert.
            }

            $usage = UserFeatureUsage::query()
                ->where('user_id', $user->id)
                ->where('feature', self::FEATURE)
                ->lockForUpdate()
                ->firstOrFail();
        }

        if ($usage->resets_at && $usage->resets_at->isPast()) {
            $usage->count = 0;
            $usage->window_started_at = now();
            $usage->exhausted_at = null;
            $usage->resets_at = null;
        }

        if ((int) $usage->count >= self::SILVER_LIMIT && $usage->resets_at && $usage->resets_at->isFuture()) {
            $usage->save();

            return $this->quotaStatus($user);
        }

        $usage->count = ((int) $usage->count) + 1;
        if (! $usage->window_started_at) {
            $usage->window_started_at = now();
        }
        if ((int) $usage->count >= self::SILVER_LIMIT) {
            $usage->exhausted_at = now();
            $usage->resets_at = now()->addDay();
        }
        $usage->save();

        return $this->quotaStatus($user);
    }

    private function mapAsset(CardImageAsset $asset): array
    {
        return [
            'id' => (string) $asset->id,
            'lang' => (string) $asset->lang,
            'arLabel' => (string) $asset->ar_label,
            'targetWord' => (string) $asset->target_word,
            'imageUrl' => (string) $asset->image_url,
        ];
    }
}
