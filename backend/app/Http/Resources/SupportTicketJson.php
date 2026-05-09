<?php

namespace App\Http\Resources;

use App\Models\SupportTicket;

class SupportTicketJson
{
    public static function fromModel(SupportTicket $ticket): array
    {
        $ticket->loadMissing(['user', 'messages']);

        $messages = $ticket->messages->map(function ($m) {
            return [
                'id' => (string) $m->id,
                'sender' => $m->sender,
                'text' => $m->text,
                'timestamp' => $m->created_at?->toIso8601String() ?? '',
            ];
        })->values()->all();

        $user = $ticket->user;

        return [
            'id' => (string) $ticket->id,
            'userId' => (string) $ticket->user_id,
            'userName' => $user?->name ?? 'مستخدم',
            'subject' => $ticket->subject,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'createdAt' => $ticket->created_at?->toIso8601String() ?? '',
            'lastUpdate' => $ticket->updated_at?->toIso8601String() ?? '',
            'messages' => $messages,
        ];
    }
}
