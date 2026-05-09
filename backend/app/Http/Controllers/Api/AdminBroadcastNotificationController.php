<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\BroadcastNotification;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminBroadcastNotificationController extends Controller
{
    public function index(Request $request)
    {
        $admin = $this->requireAdmin($request);

        $rows = BroadcastNotification::query()
            ->orderByDesc('sent_at')
            ->limit(100)
            ->get();

        return response()->json([
            'broadcasts' => $rows->map(fn (BroadcastNotification $b) => [
                'id' => (string) $b->id,
                'type' => $b->type,
                'icon' => $b->icon,
                'targetAudience' => $b->target_audience,
                'title' => $b->title,
                'message' => $b->message,
                'sentAt' => $b->sent_at?->toIso8601String() ?? '',
            ])->values()->all(),
        ]);
    }

    public function store(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'message' => ['required', 'string', 'min:1', 'max:50000'],
            'icon' => ['required', 'string', 'max:32'],
            'type' => ['required', 'string', 'in:info,warning,success,system'],
            'targetAudience' => ['required', 'string', 'in:all,active,inactive'],
        ]);

        $broadcast = BroadcastNotification::query()->create([
            'type' => $data['type'],
            'icon' => $data['icon'],
            'target_audience' => $data['targetAudience'],
            'title' => $data['title'],
            'message' => $data['message'],
            'sent_at' => now(),
        ]);

        // Broadcast -> create user_notifications rows for recipients
        $usersQuery = User::query();
        if (Schema::hasColumn('users', 'is_frozen')) {
            if ($data['targetAudience'] === 'active') {
                $usersQuery->where('is_frozen', false);
            } elseif ($data['targetAudience'] === 'inactive') {
                $usersQuery->where('is_frozen', true);
            }
        }

        $users = $usersQuery->select(['id'])->get();

        foreach ($users as $u) {
            UserNotification::query()->create([
                'user_id' => $u->id,
                'kind' => 'broadcast',
                'broadcast_id' => $broadcast->id,
                'title' => $broadcast->title,
                'body' => $broadcast->message,
                'ticket_id' => null,
                'read_at' => null,
            ]);
        }

        return response()->json([
            'broadcast' => [
                'id' => (string) $broadcast->id,
                'type' => $broadcast->type,
                'icon' => $broadcast->icon,
                'targetAudience' => $broadcast->target_audience,
                'title' => $broadcast->title,
                'message' => $broadcast->message,
                'sentAt' => $broadcast->sent_at?->toIso8601String() ?? '',
            ],
        ], 201);
    }

    public function destroy(Request $request, BroadcastNotification $broadcast)
    {
        $this->requireAdmin($request);

        $scope = $request->query('scope', 'all'); // all|admin_only

        // مسح عندي فقط: حذف سجل الـ broadcast من لوحة التحكم، بدون حذف إشعارات المستخدمين.
        if ($scope === 'admin_only') {
            $broadcast->delete();
            return response()->json(['ok' => true, 'scope' => 'admin_only']);
        }

        // مسح من عند كل الطلاب ومن عندي: حذف إشعارات المستخدمين المرتبطة بنفس البث
        // ملاحظة: في حالات قديمة كانت rows بدون broadcast_id، فنطابق title/body كحل رجوع.
        UserNotification::query()
            ->where('kind', 'broadcast')
            ->where(function ($q) use ($broadcast) {
                $q->where('broadcast_id', $broadcast->id)
                    ->orWhere(function ($q2) use ($broadcast) {
                        $q2->whereNull('broadcast_id')
                            ->where('title', $broadcast->title)
                            ->where('body', $broadcast->message);
                    });
            })
            ->delete();

        $broadcast->delete();

        return response()->json(['ok' => true]);
    }

    private function requireAdmin(Request $request): AdminUser
    {
        $u = $request->user();
        if (! $u instanceof AdminUser) {
            abort(403, 'يجب تسجيل الدخول كمسؤول.');
        }

        return $u;
    }
}

