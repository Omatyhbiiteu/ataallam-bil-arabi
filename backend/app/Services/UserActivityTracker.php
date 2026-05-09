<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserDailyActivity;

class UserActivityTracker
{
    public static function touch(User $user): void
    {
        UserDailyActivity::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'activity_on' => now()->toDateString(),
            ],
            []
        );
    }
}
