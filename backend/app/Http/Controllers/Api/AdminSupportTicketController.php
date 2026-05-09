<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketJson;
use App\Models\AdminUser;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
class AdminSupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $this->requireAdmin($request);

        $tickets = SupportTicket::query()
            ->with(['messages', 'user'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'tickets' => $tickets->map(fn (SupportTicket $t) => SupportTicketJson::fromModel($t))->values()->all(),
        ]);
    }

    public function update(Request $request, SupportTicket $ticket)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'status' => ['required', 'string', 'in:open,in_progress,resolved'],
        ]);

        $ticket->status = $data['status'];
        $ticket->save();
        $ticket->refresh()->load(['messages', 'user']);

        return response()->json([
            'ticket' => SupportTicketJson::fromModel($ticket),
        ]);
    }

    public function addMessage(Request $request, SupportTicket $ticket)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'text' => ['required', 'string', 'min:1', 'max:50000'],
        ]);

        if ($ticket->status === 'resolved') {
            $ticket->status = 'in_progress';
            $ticket->save();
        } elseif ($ticket->status === 'open') {
            $ticket->status = 'in_progress';
            $ticket->save();
        }

        SupportTicketMessage::query()->create([
            'support_ticket_id' => $ticket->id,
            'sender' => 'admin',
            'text' => $data['text'],
        ]);

        UserNotification::query()->create([
            'user_id' => $ticket->user_id,
            'kind' => 'support_reply',
            'title' => 'رد من فريق الدعم',
            'body' => sprintf(
                'فريق الدعم رد على تذكرتك «%s». افتح الإعدادات ← الدعم ← التواصل المباشر لمشاهدة الرسالة.',
                Str::limit($ticket->subject, 72)
            ),
            'ticket_id' => $ticket->id,
        ]);

        $ticket->touch();
        $ticket->refresh()->load(['messages', 'user']);

        return response()->json([
            'ticket' => SupportTicketJson::fromModel($ticket),
        ]);
    }

    private function requireAdmin(Request $request): void
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403, 'يجب تسجيل الدخول كمسؤول.');
        }
    }
}
