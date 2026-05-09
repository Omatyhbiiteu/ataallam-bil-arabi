<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminAppUserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'plan',
                'plan_subscribed_at',
                'plan_expires_at',
                'age',
                'gender',
                'start_level',
                'target_language',
                'avatar',
                'is_frozen',
                'created_at',
                'updated_at',
            ])
            ->orderByDesc('id')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'plan' => $user->plan ?: 'free',
                    'planSubscribedAt' => optional($user->plan_subscribed_at)->toISOString(),
                    'planExpiresAt' => optional($user->plan_expires_at)->toISOString(),
                    'age' => $user->age,
                    'gender' => $user->gender,
                    'startLevel' => $user->start_level,
                    'targetLanguage' => $user->target_language,
                    'avatar' => $user->avatar,
                    'isFrozen' => (bool) $user->is_frozen,
                    'joinDate' => optional($user->created_at)->toISOString(),
                    'lastActive' => optional($user->updated_at)->toISOString(),
                ];
            });

        return response()->json([
            'users' => $users,
            'summary' => [
                'totalUsers' => $users->count(),
                'proUsers' => $users->whereIn('plan', ['silver', 'pro', 'enterprise'])->count(),
                'frozenUsers' => $users->where('isFrozen', true)->count(),
                'activeUsers' => $users->where('isFrozen', false)->count(),
            ],
        ]);
    }

    public function updatePlan(Request $request, User $user)
    {
        $data = $request->validate([
            'plan' => ['required', 'string', Rule::in(['free', 'silver', 'pro', 'enterprise'])],
        ]);

        $user->plan = $data['plan'];

        if (in_array($data['plan'], ['silver', 'pro', 'enterprise'], true)) {
            $user->plan_subscribed_at = Carbon::now();
            $user->plan_expires_at = Carbon::now()->addMonth();
        } else {
            $user->plan_subscribed_at = null;
            $user->plan_expires_at = null;
        }

        $user->save();

        return response()->json([
            'message' => 'تم تحديث خطة المستخدم بنجاح',
            'user' => [
                'id' => (string) $user->id,
                'plan' => $user->plan,
                'planSubscribedAt' => optional($user->plan_subscribed_at)->toISOString(),
                'planExpiresAt' => optional($user->plan_expires_at)->toISOString(),
            ],
        ]);
    }

    public function toggleFreeze(User $user)
    {
        $user->is_frozen = !((bool) $user->is_frozen);
        $user->save();

        return response()->json([
            'message' => $user->is_frozen ? 'تم تجميد الحساب' : 'تم إلغاء تجميد الحساب',
            'user' => [
                'id' => (string) $user->id,
                'isFrozen' => (bool) $user->is_frozen,
            ],
        ]);
    }

    public function updatePassword(Request $request, User $user)
    {
        $data = $request->validate([
            'new_password' => ['required', 'string', 'min:6', 'max:120'],
        ]);

        $user->password = Hash::make($data['new_password']);
        $user->save();

        return response()->json([
            'message' => 'تم تحديث كلمة مرور المستخدم بنجاح',
            'user' => [
                'id' => (string) $user->id,
            ],
        ]);
    }
}

