<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentCard;
use App\Models\ContentFolder;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserCardController extends Controller
{
    private const FREE_MAX_CARDS_PER_FOLDER = 10;

    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }

        return $lang;
    }

    private function appUser(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        return $user;
    }

    public function store(Request $request, string $lang)
    {
        $user = $this->appUser($request);
        $lang = $this->assertLang($lang);

        $data = $request->validate([
            'folderId' => ['required', 'string', 'max:64'],
            'frontText' => ['required', 'string', 'max:65535'],
            'backText' => ['required', 'string', 'max:65535'],
            'frontImage' => ['nullable', 'string', 'max:16777215'],
            'frontImageFit' => ['nullable', 'string', 'in:wide,portrait'],
        ]);

        $folder = ContentFolder::query()->where('lang', $lang)->where('id', $data['folderId'])->first();
        if (! $folder || ! $this->userMaySaveDictionaryCardToFolder($user, $folder)) {
            abort(422, 'لا يمكن الحفظ في هذا المجلد أو غير موجود.');
        }

        if (! $user->hasActivePaidPlan()) {
            $this->assertFreeTierFolderCardCap($user, $lang, $data['folderId']);
        }

        $now = (int) (microtime(true) * 1000);

        $card = ContentCard::query()->create([
            'id' => (string) Str::uuid(),
            'lang' => $lang,
            'user_id' => $user->id,
            'folder_id' => $data['folderId'],
            'front_text' => $data['frontText'],
            'back_text' => $data['backText'],
            'front_image' => $data['frontImage'] ?? null,
            'front_image_fit' => $data['frontImageFit'] ?? null,
            'next_review' => $now,
            'interval' => 0,
            'reviews' => 0,
            'ease_factor' => 2.5,
            'status' => 'new',
            'is_system' => false,
        ]);

        return response()->json(['card' => $this->mapCard($card)]);
    }

    public function update(Request $request, string $lang, string $cardId)
    {
        $user = $this->appUser($request);
        $lang = $this->assertLang($lang);

        $card = ContentCard::query()->where('lang', $lang)->where('id', $cardId)->firstOrFail();
        if ($card->is_system || (int) $card->user_id !== (int) $user->id) {
            abort(403, 'لا يمكن تعديل هذه البطاقة.');
        }

        $data = $request->validate([
            'folderId' => ['sometimes', 'string', 'max:64'],
            'frontText' => ['sometimes', 'string', 'max:65535'],
            'backText' => ['sometimes', 'string', 'max:65535'],
            'frontImage' => ['nullable', 'string', 'max:16777215'],
            'frontImageFit' => ['nullable', 'string', 'in:wide,portrait'],
            'nextReview' => ['sometimes', 'integer'],
            'interval' => ['sometimes', 'integer'],
            'reviews' => ['sometimes', 'integer'],
            'easeFactor' => ['sometimes', 'numeric'],
            'status' => ['sometimes', 'string', 'max:32'],
        ]);

        if (isset($data['folderId'])) {
            $folder = ContentFolder::query()->where('lang', $lang)->where('id', $data['folderId'])->first();
            if (! $folder || ! $this->userMaySaveDictionaryCardToFolder($user, $folder)) {
                abort(422, 'المجلد الهدف غير صالح.');
            }
            if (! $user->hasActivePaidPlan() && (string) $data['folderId'] !== (string) $card->folder_id) {
                $this->assertFreeTierFolderCardCap($user, $lang, (string) $data['folderId']);
            }
        }

        $card->update([
            'folder_id' => $data['folderId'] ?? $card->folder_id,
            'front_text' => $data['frontText'] ?? $card->front_text,
            'back_text' => $data['backText'] ?? $card->back_text,
            'front_image' => array_key_exists('frontImage', $data) ? $data['frontImage'] : $card->front_image,
            'front_image_fit' => array_key_exists('frontImageFit', $data) ? $data['frontImageFit'] : $card->front_image_fit,
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
        $user = $this->appUser($request);
        $lang = $this->assertLang($lang);

        $card = ContentCard::query()->where('lang', $lang)->where('id', $cardId)->firstOrFail();
        if ($card->is_system || (int) $card->user_id !== (int) $user->id) {
            abort(403);
        }
        $card->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * حفظ من القاموس أو إضافة بطاقة: مسموح في مجلدات النظام، والمجلدات المشتركة (بدون user_id)، ومجلدات المستخدم.
     */
    private function assertFreeTierFolderCardCap(User $user, string $lang, string $folderId): void
    {
        $n = ContentCard::query()
            ->where('lang', $lang)
            ->where('folder_id', $folderId)
            ->where('user_id', $user->id)
            ->count();
        if ($n >= self::FREE_MAX_CARDS_PER_FOLDER) {
            abort(422, 'الخطة المجانية تسمح بحد أقصى 10 بطاقات لكل مجلد.');
        }
    }

    private function userMaySaveDictionaryCardToFolder(User $user, ContentFolder $folder): bool
    {
        if ($folder->is_system) {
            return true;
        }
        if ($folder->user_id === null) {
            return true;
        }

        return (int) $folder->user_id === (int) $user->id;
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
