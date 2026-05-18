<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\CardImageAsset;
use App\Support\CardImageTermNormalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminCardImageAssetController extends Controller
{
    private function requireAdmin(Request $request): AdminUser
    {
        $admin = $request->user();
        if (! $admin instanceof AdminUser) {
            abort(403);
        }

        return $admin;
    }

    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }

        return $lang;
    }

    public function index(Request $request)
    {
        $this->requireAdmin($request);

        $lang = $request->query('lang');
        $q = CardImageAsset::query()->with('terms')->orderByDesc('updated_at');

        if ($lang !== null && $lang !== '') {
            $q->where('lang', $this->assertLang((string) $lang));
        }

        $rows = $q->limit(500)->get();

        return response()->json([
            'assets' => $rows->map(fn (CardImageAsset $asset) => $this->mapAsset($asset))->values()->all(),
        ]);
    }

    public function store(Request $request)
    {
        $admin = $this->requireAdmin($request);

        $data = $request->validate([
            'lang' => ['required', 'string', 'in:en,de'],
            'arLabel' => ['required', 'string', 'max:255'],
            'targetWord' => ['required', 'string', 'max:255'],
            'keywords' => ['nullable', 'string', 'max:2000'],
            'imageUrl' => ['nullable', 'string', 'max:2048'],
            'file' => ['nullable', 'file', 'max:5120', 'mimes:jpeg,jpg,png,gif,webp'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        if (! $request->hasFile('file') && empty($data['imageUrl'])) {
            return response()->json(['message' => 'اختار صورة أو ضع رابط صورة.'], 422);
        }

        $imageUrl = $data['imageUrl'] ?? null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('card-image-assets/'.$data['lang'], 'public');
            $imageUrl = '/storage/'.str_replace('\\', '/', $path);
        }

        $asset = DB::transaction(function () use ($data, $admin, $imageUrl) {
            $asset = CardImageAsset::query()->create([
                'id' => (string) Str::uuid(),
                'lang' => $data['lang'],
                'ar_label' => trim($data['arLabel']),
                'target_word' => trim($data['targetWord']),
                'image_url' => $imageUrl,
                'is_active' => (bool) ($data['isActive'] ?? true),
                'created_by_admin_id' => $admin->id,
            ]);

            $this->syncTerms($asset, (string) ($data['keywords'] ?? ''));

            return $asset->fresh('terms');
        });

        return response()->json(['asset' => $this->mapAsset($asset)], 201);
    }

    public function update(Request $request, string $assetId)
    {
        $this->requireAdmin($request);

        $asset = CardImageAsset::query()->where('id', $assetId)->firstOrFail();

        $data = $request->validate([
            'arLabel' => ['sometimes', 'string', 'max:255'],
            'targetWord' => ['sometimes', 'string', 'max:255'],
            'keywords' => ['nullable', 'string', 'max:2000'],
            'imageUrl' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $asset = DB::transaction(function () use ($asset, $data) {
            $updates = [];
            if (array_key_exists('arLabel', $data)) {
                $updates['ar_label'] = trim((string) $data['arLabel']);
            }
            if (array_key_exists('targetWord', $data)) {
                $updates['target_word'] = trim((string) $data['targetWord']);
            }
            if (array_key_exists('imageUrl', $data) && $data['imageUrl']) {
                $updates['image_url'] = trim((string) $data['imageUrl']);
            }
            if (array_key_exists('isActive', $data)) {
                $updates['is_active'] = (bool) $data['isActive'];
            }
            if ($updates !== []) {
                $asset->update($updates);
            }
            if (array_key_exists('keywords', $data) || array_key_exists('arLabel', $data) || array_key_exists('targetWord', $data)) {
                $this->syncTerms($asset->fresh(), (string) ($data['keywords'] ?? ''));
            }

            return $asset->fresh('terms');
        });

        return response()->json(['asset' => $this->mapAsset($asset)]);
    }

    public function destroy(Request $request, string $assetId)
    {
        $this->requireAdmin($request);

        $asset = CardImageAsset::query()->where('id', $assetId)->firstOrFail();
        $asset->delete();

        return response()->json(['ok' => true]);
    }

    private function syncTerms(CardImageAsset $asset, string $keywords = ''): void
    {
        $asset->terms()->delete();

        $rows = [];
        $this->pushTermRows($rows, $asset->id, 'ar', $asset->ar_label);
        $this->pushTermRows($rows, $asset->id, $asset->lang, $asset->target_word);

        $extraTerms = preg_split('/[\n,،;]+/u', $keywords) ?: [];
        foreach ($extraTerms as $term) {
            $term = trim((string) $term);
            if ($term === '') {
                continue;
            }
            $lang = preg_match('/\p{Arabic}/u', $term) ? 'ar' : $asset->lang;
            $this->pushTermRows($rows, $asset->id, $lang, $term);
        }

        if ($rows !== []) {
            $asset->terms()->insert(array_values($rows));
        }
    }

    /**
     * @param list<array<string, mixed>> $rows
     */
    private function pushTermRows(array &$rows, string $assetId, string $lang, string $term): void
    {
        foreach (CardImageTermNormalizer::variants($term) as $normalized) {
            $rows[$assetId.'|'.$lang.'|'.$normalized] = [
                'asset_id' => $assetId,
                'lang' => $lang,
                'term' => $term,
                'term_normalized' => $normalized,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
    }

    private function mapAsset(CardImageAsset $asset): array
    {
        return [
            'id' => (string) $asset->id,
            'lang' => (string) $asset->lang,
            'arLabel' => (string) $asset->ar_label,
            'targetWord' => (string) $asset->target_word,
            'imageUrl' => (string) $asset->image_url,
            'isActive' => (bool) $asset->is_active,
            'createdAt' => optional($asset->created_at)->toISOString(),
            'updatedAt' => optional($asset->updated_at)->toISOString(),
        ];
    }
}
