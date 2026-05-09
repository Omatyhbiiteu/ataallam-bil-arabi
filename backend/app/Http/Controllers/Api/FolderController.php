<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOptionalAppUser;
use App\Http\Controllers\Controller;
use App\Models\ContentFolder;
use Illuminate\Http\Request;

class FolderController extends Controller
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

        $rows = ContentFolder::query()
            ->where('lang', $lang)
            ->where(function ($q) use ($user) {
                $q->where('is_system', true);
                if ($user) {
                    $q->orWhere('user_id', $user->id);
                }
            })
            ->orderBy('name')
            ->limit(2000)
            ->get();

        return response()->json([
            'folders' => $rows->map(fn (ContentFolder $f) => $this->mapFolder($f))->values()->all(),
        ]);
    }

    private function mapFolder(ContentFolder $f): array
    {
        return [
            'id' => (string) $f->id,
            'name' => (string) $f->name,
            'color' => (string) $f->color,
            'createdAt' => (int) (($f->created_at?->timestamp ?? time()) * 1000),
            'isSystem' => (bool) $f->is_system,
            'parentId' => $f->parent_id ? (string) $f->parent_id : null,
            'contentLang' => $f->content_lang ? (string) $f->content_lang : 'en',
            'userId' => $f->user_id !== null ? (string) $f->user_id : null,
        ];
    }
}
