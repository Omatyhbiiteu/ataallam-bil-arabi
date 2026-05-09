<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketJson;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use App\Support\AdminSupportNotifier;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserSupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->requireAppUser($request);

        $tickets = SupportTicket::query()
            ->where('user_id', $user->id)
            ->with(['messages', 'user'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'tickets' => $tickets->map(fn (SupportTicket $t) => SupportTicketJson::fromModel($t))->values()->all(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->requireAppUser($request);

        $data = $request->validate([
            'subject' => ['required', 'string', 'min:2', 'max:255'],
            'message' => ['required', 'string', 'min:1', 'max:50000'],
        ]);

        $ticket = new SupportTicket([
            'user_id' => $user->id,
            'subject' => $data['subject'],
            'status' => 'open',
            'priority' => 'medium',
        ]);
        $ticket->save();

        SupportTicketMessage::query()->create([
            'support_ticket_id' => $ticket->id,
            'sender' => 'user',
            'text' => $data['message'],
        ]);

        $ticket->refresh()->load(['messages', 'user']);
        AdminSupportNotifier::notifyNewTicket($ticket, $user);

        return response()->json([
            'ticket' => SupportTicketJson::fromModel($ticket),
        ], 201);
    }

    public function addMessage(Request $request, SupportTicket $ticket)
    {
        $user = $this->requireAppUser($request);

        if ((int) $ticket->user_id !== (int) $user->id) {
            throw ValidationException::withMessages([
                'ticket' => ['غير مصرح بالوصول لهذه التذكرة.'],
            ]);
        }

        $data = $request->validate([
            'text' => ['required', 'string', 'min:1', 'max:50000'],
        ]);

        if ($ticket->status === 'resolved') {
            $ticket->status = 'open';
            $ticket->save();
        }

        SupportTicketMessage::query()->create([
            'support_ticket_id' => $ticket->id,
            'sender' => 'user',
            'text' => $data['text'],
        ]);

        $ticket->touch();
        $ticket->refresh()->load(['messages', 'user']);
        AdminSupportNotifier::notifyUserMessage($ticket, $user);

        return response()->json([
            'ticket' => SupportTicketJson::fromModel($ticket),
        ]);
    }

    private function requireAppUser(Request $request): User
    {
        $u = $request->user();
        if (! $u instanceof User) {
            abort(403, 'يجب تسجيل الدخول كمستخدم التطبيق.');
        }

        return $u;
    }
}
