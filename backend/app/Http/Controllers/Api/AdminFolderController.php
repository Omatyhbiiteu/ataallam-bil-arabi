<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\ContentCard;
use App\Models\ContentFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminFolderController extends Controller
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

        $rows = ContentFolder::query()
            ->where('lang', $lang)
            ->orderBy('name')
            ->limit(2000)
            ->get();

        return response()->json([
            'folders' => $rows->map(fn (ContentFolder $f) => $this->mapFolder($f))->values()->all(),
        ]);
    }

    public function store(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:128'],
            'parentId' => ['nullable', 'string', 'max:64'],
            'isSystem' => ['sometimes', 'boolean'],
            'contentLang' => ['sometimes', 'in:en,de,both'],
            'id' => ['sometimes', 'string', 'max:64'],
        ]);

        if (! empty($data['parentId'])) {
            $parent = ContentFolder::query()->where('lang', $lang)->where('id', $data['parentId'])->first();
            if (! $parent) {
                abort(422, 'المجلد الأب غير موجود أو بلغة مختلفة.');
            }
        }

        $contentLang = $data['contentLang'] ?? $lang;
        if ($contentLang === 'both' && $lang !== 'en' && $lang !== 'de') {
            $contentLang = 'both';
        }

        $hasParent = ! empty($data['parentId']);
        $defaultSystem = ! $hasParent;

        $folder = ContentFolder::query()->create([
            'id' => isset($data['id']) ? (string) $data['id'] : (string) Str::uuid(),
            'lang' => $lang,
            'user_id' => null,
            'parent_id' => $data['parentId'] ?? null,
            'name' => $data['name'],
            'color' => $data['color'] ?? 'bg-blue-500',
            'content_lang' => $contentLang,
            'is_system' => (bool) ($data['isSystem'] ?? $defaultSystem),
        ]);

        return response()->json(['folder' => $this->mapFolder($folder)]);
    }

    public function update(Request $request, string $lang, string $folderId)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $folder = ContentFolder::query()->where('lang', $lang)->where('id', $folderId)->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:128'],
            'parentId' => ['nullable', 'string', 'max:64'],
            'contentLang' => ['sometimes', 'in:en,de,both'],
            'isSystem' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('parentId', $data)) {
            $pid = $data['parentId'];
            if ($pid !== null && $pid !== '') {
                if ($pid === $folder->id) {
                    abort(422, 'لا يمكن جعل المجلد أباً لنفسه.');
                }
                $parent = ContentFolder::query()->where('lang', $lang)->where('id', $pid)->first();
                if (! $parent) {
                    abort(422, 'المجلد الأب غير موجود.');
                }
            }
        }

        $updates = [];
        if (array_key_exists('name', $data)) {
            $updates['name'] = $data['name'];
        }
        if (array_key_exists('color', $data)) {
            $updates['color'] = $data['color'];
        }
        if (array_key_exists('parentId', $data)) {
            $updates['parent_id'] = $data['parentId'] ?: null;
        }
        if (array_key_exists('contentLang', $data)) {
            $updates['content_lang'] = $data['contentLang'];
        }
        if (array_key_exists('isSystem', $data)) {
            $updates['is_system'] = (bool) $data['isSystem'];
        }
        if ($updates !== []) {
            $folder->update($updates);
        }

        return response()->json(['folder' => $this->mapFolder($folder->fresh())]);
    }

    public function destroy(Request $request, string $lang, string $folderId)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $folder = ContentFolder::query()->where('lang', $lang)->where('id', $folderId)->firstOrFail();

        $ids = $this->collectDescendantFolderIds($lang, $folder->id);

        ContentCard::query()->where('lang', $lang)->whereIn('folder_id', $ids)->delete();
        ContentFolder::query()->where('lang', $lang)->whereIn('id', $ids)->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * @return list<string>
     */
    private function collectDescendantFolderIds(string $lang, string $rootId): array
    {
        $all = ContentFolder::query()->where('lang', $lang)->get(['id', 'parent_id']);
        $ids = [$rootId];
        $changed = true;
        while ($changed) {
            $changed = false;
            foreach ($all as $f) {
                $pid = $f->parent_id ? (string) $f->parent_id : null;
                $fid = (string) $f->id;
                if ($pid && in_array($pid, $ids, true) && ! in_array($fid, $ids, true)) {
                    $ids[] = $fid;
                    $changed = true;
                }
            }
        }

        return $ids;
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
            'contentLang' => (string) $f->content_lang,
            'userId' => $f->user_id !== null ? (string) $f->user_id : null,
        ];
    }
}
