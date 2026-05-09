<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentCard;
use App\Models\ContentFolder;
use App\Models\User;
use Illuminate\Http\Request;

class UserFolderController extends Controller
{
    private const FREE_MAX_ROOT_FOLDERS = 3;

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
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:128'],
            'parentId' => ['nullable', 'string', 'max:64'],
        ]);

        $parentId = $data['parentId'] ?? null;
        if (! $user->hasActivePaidPlan()) {
            if ($parentId !== null && $parentId !== '') {
                abort(422, 'المجلدات الفرعية (مجلد داخل مجلد) متاحة لمشتركي الخطة المدفوعة فقط.');
            }
            $myRootCount = ContentFolder::query()
                ->where('lang', $lang)
                ->where('user_id', $user->id)
                ->where('is_system', false)
                ->whereNull('parent_id')
                ->count();
            if ($myRootCount >= self::FREE_MAX_ROOT_FOLDERS) {
                abort(422, 'الخطة المجانية تسمح بحد أقصى 3 مجلدات رئيسية لكل لغة.');
            }
        }

        if ($parentId !== null && $parentId !== '') {
            $parent = ContentFolder::query()->where('lang', $lang)->where('id', $parentId)->first();
            if (! $parent) {
                abort(422, 'المجلد الأب غير موجود.');
            }
            if ($parent->is_system) {
                abort(422, 'لا يمكن إنشاء مجلد داخل مجلد النظام.');
            }
            if ((int) $parent->user_id !== (int) $user->id) {
                abort(422, 'لا يمكن الإنشاء إلا داخل مجلداتك.');
            }
        }

        $folder = ContentFolder::query()->create([
            'lang' => $lang,
            'user_id' => $user->id,
            'parent_id' => $parentId ?: null,
            'name' => $data['name'],
            'color' => $data['color'] ?? 'bg-blue-500',
            'content_lang' => $lang,
            'is_system' => false,
        ]);

        return response()->json(['folder' => $this->mapFolder($folder)]);
    }

    public function update(Request $request, string $lang, string $folderId)
    {
        $user = $this->appUser($request);
        $lang = $this->assertLang($lang);

        $folder = ContentFolder::query()->where('lang', $lang)->where('id', $folderId)->firstOrFail();
        if ($folder->is_system || (int) $folder->user_id !== (int) $user->id) {
            abort(403, 'لا يمكن تعديل هذا المجلد.');
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:128'],
            'parentId' => ['nullable', 'string', 'max:64'],
        ]);

        if (array_key_exists('parentId', $data)) {
            $pid = $data['parentId'];
            if ($pid !== null && $pid !== '' && ! $user->hasActivePaidPlan()) {
                abort(422, 'تعيين مجلد أب (مجلد فرعي) متاح لمشتركي الخطة المدفوعة فقط.');
            }
            if ($pid !== null && $pid !== '') {
                if ($pid === $folder->id) {
                    abort(422, 'لا يمكن جعل المجلد أباً لنفسه.');
                }
                $parent = ContentFolder::query()->where('lang', $lang)->where('id', $pid)->first();
                if (! $parent || $parent->is_system || (int) $parent->user_id !== (int) $user->id) {
                    abort(422, 'مجلد الأب غير صالح.');
                }
            }
        }

        $updates = [];
        if (array_key_exists('name', $data)) {
            $updates['name'] = $data['name'];
        }
        if (array_key_exists('color', $data)) {
            $updates['color'] = $data['color'] ?? 'bg-blue-500';
        }
        if (array_key_exists('parentId', $data)) {
            $updates['parent_id'] = $data['parentId'] ?: null;
        }
        if ($updates !== []) {
            $folder->update($updates);
        }

        return response()->json(['folder' => $this->mapFolder($folder->fresh())]);
    }

    public function destroy(Request $request, string $lang, string $folderId)
    {
        $user = $this->appUser($request);
        $lang = $this->assertLang($lang);

        $folder = ContentFolder::query()->where('lang', $lang)->where('id', $folderId)->firstOrFail();
        if ($folder->is_system || (int) $folder->user_id !== (int) $user->id) {
            abort(403, 'لا يمكن حذف هذا المجلد.');
        }

        $ids = $this->collectDescendantFolderIds($lang, $folder->id);
        $hasForeign = ContentFolder::query()->where('lang', $lang)->whereIn('id', $ids)
            ->where(function ($q) use ($user) {
                $q->where('is_system', true)
                    ->orWhereNull('user_id')
                    ->orWhere('user_id', '!=', $user->id);
            })->exists();
        if ($hasForeign) {
            abort(403, 'لا يمكن حذف هذا المجلد.');
        }

        ContentCard::query()->where('lang', $lang)->whereIn('folder_id', $ids)->delete();
        ContentFolder::query()->where('lang', $lang)->whereIn('id', $ids)->delete();

        return response()->json(['ok' => true]);
    }

    public function destroyAllMine(Request $request, string $lang)
    {
        $user = $this->appUser($request);
        $lang = $this->assertLang($lang);

        $folderIds = ContentFolder::query()
            ->where('lang', $lang)
            ->where('user_id', $user->id)
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();

        if ($folderIds === []) {
            return response()->json(['ok' => true, 'deletedFolders' => 0, 'deletedCards' => 0]);
        }

        $deletedCards = ContentCard::query()->where('lang', $lang)->whereIn('folder_id', $folderIds)->delete();
        $deletedFolders = ContentFolder::query()->where('lang', $lang)->whereIn('id', $folderIds)->delete();

        return response()->json([
            'ok' => true,
            'deletedFolders' => $deletedFolders,
            'deletedCards' => $deletedCards,
        ]);
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
            'contentLang' => $f->content_lang ? (string) $f->content_lang : 'en',
            'userId' => $f->user_id !== null ? (string) $f->user_id : null,
        ];
    }
}
