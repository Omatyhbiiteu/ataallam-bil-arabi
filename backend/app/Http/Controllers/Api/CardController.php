<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOptionalAppUser;
use App\Http\Controllers\Controller;
use App\Models\ContentCard;
use App\Models\ContentFolder;
use Illuminate\Http\Request;

class CardController extends Controller
{
    use ResolvesOptionalAppUser;

    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }

        return $lang;
    }

    public function index(Request $request, string $lang)
    {
        $lang = $this->assertLang($lang);
        $user = $this->optionalAppUser($request);

        $fq = ContentFolder::query()
            ->where('lang', $lang)
            ->where(function ($w) use ($user) {
                $w->where('is_system', true);
                if ($user) {
                    $w->orWhere('user_id', $user->id);
                }
            });
        $folderIds = $fq->pluck('id')->map(fn ($id) => (string) $id)->all();

        $folderIdFilter = $request->query('folderId');
        $q = ContentCard::query()->where('lang', $lang)->whereIn('folder_id', $folderIds);
        if ($folderIdFilter !== null && $folderIdFilter !== '') {
            $fid = (string) $folderIdFilter;
            if (in_array($fid, $folderIds, true)) {
                $q->where('folder_id', $fid);
            } else {
                $q->whereRaw('1 = 0');
            }
        }

        $rows = $q->orderByDesc('updated_at')->limit(5000)->get();

        return response()->json([
            'cards' => $rows->map(fn (ContentCard $c) => $this->mapCard($c))->values()->all(),
        ]);
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
