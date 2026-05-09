<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        $rows = UserNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(80)
            ->get();

        return response()->json([
            'notifications' => $rows->map(fn (UserNotification $n) => [
                'id' => (string) $n->id,
                'kind' => $n->kind,
                'title' => $n->title,
                'body' => $n->body,
                'ticketId' => $n->ticket_id ? (string) $n->ticket_id : null,
                'broadcastId' => $n->broadcast_id ? (string) $n->broadcast_id : null,
                'readAt' => $n->read_at?->toIso8601String(),
                'createdAt' => $n->created_at?->toIso8601String() ?? '',
            ])->values()->all(),
        ]);
    }

    public function markRead(Request $request)
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'uuid'],
        ]);

        UserNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $data['ids'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
