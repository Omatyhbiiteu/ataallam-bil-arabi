<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use App\Models\AdminUser;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        $admin = $this->requireAdmin($request);

        $rows = AdminNotification::query()
            ->where('admin_user_id', $admin->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'notifications' => $rows->map(fn (AdminNotification $n) => [
                'id' => (string) $n->id,
                'kind' => $n->kind,
                'title' => $n->title,
                'body' => $n->body,
                'ticketId' => $n->ticket_id ? (string) $n->ticket_id : null,
                'readAt' => $n->read_at?->toIso8601String(),
                'createdAt' => $n->created_at?->toIso8601String() ?? '',
            ])->values()->all(),
        ]);
    }

    public function markRead(Request $request)
    {
        $admin = $this->requireAdmin($request);

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'uuid'],
        ]);

        AdminNotification::query()
            ->where('admin_user_id', $admin->id)
            ->whereIn('id', $data['ids'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $admin = $this->requireAdmin($request);

        AdminNotification::query()
            ->where('admin_user_id', $admin->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

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
