<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\ContentCard;
use App\Models\ContentFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCardController extends Controller
{
    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }

        return $lang;
    }

    private function requireAdmin(Request $request): void
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }
    }

    public function index(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        $folderId = $request->query('folderId');

        $q = ContentCard::query()->where('lang', $lang);
        if ($folderId !== null && $folderId !== '') {
            $q->where('folder_id', (string) $folderId);
        }

        $rows = $q->orderByDesc('updated_at')->limit(5000)->get();

        return response()->json([
            'cards' => $rows->map(fn (ContentCard $c) => $this->mapCard($c))->values()->all(),
        ]);
    }

    public function store(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $data = $request->validate([
            'folderId' => ['required', 'string', 'max:64'],
            'frontText' => ['required', 'string', 'max:65535'],
            'backText' => ['required', 'string', 'max:65535'],
            'frontImage' => ['nullable', 'string', 'max:16777215'],
            'frontImageFit' => ['nullable', 'string', 'in:wide,portrait'],
            'isSystem' => ['sometimes', 'boolean'],
            'id' => ['sometimes', 'string', 'max:64'],
            'nextReview' => ['sometimes', 'integer'],
            'interval' => ['sometimes', 'integer'],
            'reviews' => ['sometimes', 'integer'],
            'easeFactor' => ['sometimes', 'numeric'],
            'status' => ['sometimes', 'string', 'max:32'],
        ]);

        $folder = ContentFolder::query()->where('lang', $lang)->where('id', $data['folderId'])->first();
        if (! $folder) {
            abort(422, 'المجلد غير موجود.');
        }

        $now = (int) (microtime(true) * 1000);

        $card = ContentCard::query()->create([
            'id' => isset($data['id']) ? (string) $data['id'] : (string) Str::uuid(),
            'lang' => $lang,
            'user_id' => null,
            'folder_id' => $data['folderId'],
            'front_text' => $data['frontText'],
            'back_text' => $data['backText'],
            'front_image' => $data['frontImage'] ?? null,
            'front_image_fit' => $data['frontImageFit'] ?? null,
            'next_review' => $data['nextReview'] ?? $now,
            'interval' => $data['interval'] ?? 0,
            'reviews' => $data['reviews'] ?? 0,
            'ease_factor' => $data['easeFactor'] ?? 2.5,
            'status' => $data['status'] ?? 'new',
            'is_system' => (bool) ($data['isSystem'] ?? true),
        ]);

        return response()->json(['card' => $this->mapCard($card)]);
    }

    public function update(Request $request, string $lang, string $cardId)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $card = ContentCard::query()->where('lang', $lang)->where('id', $cardId)->firstOrFail();

        $data = $request->validate([
            'folderId' => ['sometimes', 'string', 'max:64'],
            'frontText' => ['sometimes', 'string', 'max:65535'],
            'backText' => ['sometimes', 'string', 'max:65535'],
            'frontImage' => ['nullable', 'string', 'max:16777215'],
            'frontImageFit' => ['nullable', 'string', 'in:wide,portrait'],
            'isSystem' => ['sometimes', 'boolean'],
            'nextReview' => ['sometimes', 'integer'],
            'interval' => ['sometimes', 'integer'],
            'reviews' => ['sometimes', 'integer'],
            'easeFactor' => ['sometimes', 'numeric'],
            'status' => ['sometimes', 'string', 'max:32'],
        ]);

        if (isset($data['folderId'])) {
            $folder = ContentFolder::query()->where('lang', $lang)->where('id', $data['folderId'])->first();
            if (! $folder) {
                abort(422, 'المجلد غير موجود.');
            }
        }

        $card->update([
            'folder_id' => $data['folderId'] ?? $card->folder_id,
            'front_text' => $data['frontText'] ?? $card->front_text,
            'back_text' => $data['backText'] ?? $card->back_text,
            'front_image' => array_key_exists('frontImage', $data) ? $data['frontImage'] : $card->front_image,
            'front_image_fit' => array_key_exists('frontImageFit', $data) ? $data['frontImageFit'] : $card->front_image_fit,
            'is_system' => array_key_exists('isSystem', $data) ? (bool) $data['isSystem'] : $card->is_system,
            'next_review' => $data['nextReview'] ?? $card->next_review,
            'interval' => $data['interval'] ?? $card->interval,
            'reviews' => $data['reviews'] ?? $card->reviews,
            'ease_factor' => $data['easeFactor'] ?? $card->ease_factor,
            'status' => $data['status'] ?? $card->status,
        ]);

        return response()->json(['card' => $this->mapCard($card->fresh())]);
    }

    public function destroy(Request $request, string $lang, string $cardId)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $card = ContentCard::query()->where('lang', $lang)->where('id', $cardId)->firstOrFail();
        $card->delete();

        return response()->json(['ok' => true]);
    }

    private function mapCard(ContentCard $c): array
    {
        return [
            'id' => (string) $c->id,
            'folderId' => (string) $c->folder_id,
            'frontText' => (string) $c->front_text,
            'backText' => (string) $c->back_text,
            'frontImage' => $c->front_image ? (string) $c->front_image : null,
            'frontImageFit' => in_array($c->front_image_fit, ['wide', 'portrait'], true) ? (string) $c->front_image_fit : null,
            'createdAt' => (int) (($c->created_at?->timestamp ?? time()) * 1000),
            'nextReview' => (int) $c->next_review,
            'interval' => (int) $c->interval,
            'reviews' => (int) $c->reviews,
            'easeFactor' => (float) $c->ease_factor,
            'status' => (string) $c->status,
            'isSystem' => (bool) $c->is_system,
            'userId' => $c->user_id !== null ? (string) $c->user_id : null,
        ];
    }
}
