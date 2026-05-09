<?php

namespace App\Support;

use App\Models\AdminNotification;
use App\Models\AdminUser;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Support\Str;

class AdminSupportNotifier
{
    public static function notifyNewTicket(SupportTicket $ticket, User $user): void
    {
        try {
            $subject = Str::limit($ticket->subject, 80);
            $userDisplay = trim((string) ($user->name ?: '')) ?: ($user->email ?? 'مستخدم');

            foreach (AdminUser::query()->cursor() as $admin) {
                AdminNotification::query()->create([
                    'admin_user_id' => $admin->id,
                    'kind' => 'support_new_ticket',
                    'title' => 'شكوى أو تذكرة دعم جديدة',
                    'body' => sprintf('المستخدم %s أرسل تذكرة: «%s»', $userDisplay, $subject),
                    'ticket_id' => $ticket->id,
                ]);
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public static function notifyUserMessage(SupportTicket $ticket, User $user): void
    {
        try {
            $subject = Str::limit($ticket->subject, 80);
            $userDisplay = trim((string) ($user->name ?: '')) ?: ($user->email ?? 'مستخدم');

            foreach (AdminUser::query()->cursor() as $admin) {
                AdminNotification::query()->create([
                    'admin_user_id' => $admin->id,
                    'kind' => 'support_user_message',
                    'title' => 'رسالة جديدة من مستخدم',
                    'body' => sprintf('رد على التذكرة «%s» من %s', $subject, $userDisplay),
                    'ticket_id' => $ticket->id,
                ]);
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
