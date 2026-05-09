<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserActivityTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserAuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'max:120'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => Hash::make($data['password']),
            'plan' => 'free',
        ]);

        $token = $user->createToken('user-auth')->plainTextToken;
        UserActivityTracker::touch($user);

        return response()->json([
            'token' => $token,
            'user' => $this->mapUser($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::query()->where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة'],
            ]);
        }

        $token = $user->createToken('user-auth')->plainTextToken;
        UserActivityTracker::touch($user);

        return response()->json([
            'token' => $token,
            'user' => $this->mapUser($user),
        ]);
    }

    public function socialRegister(Request $request)
    {
        $data = $request->validate([
            'provider' => ['required', 'string', 'in:google,facebook'],
            'email' => ['required', 'email', 'max:190'],
            'name' => ['nullable', 'string', 'max:120'],
            'avatar' => ['nullable', 'string', 'max:2000'],
        ]);

        $existing = User::query()->where('email', strtolower($data['email']))->first();
        if ($existing) {
            throw ValidationException::withMessages([
                'email' => ['هذا البريد الإلكتروني موجود بالفعل'],
            ]);
        }

        $user = User::query()->create([
            'name' => $data['name'] ?: strtok($data['email'], '@'),
            'email' => strtolower($data['email']),
            'password' => Hash::make(bin2hex(random_bytes(16))),
            'plan' => 'free',
            'avatar' => $data['avatar'] ?? null,
        ]);

        $token = $user->createToken('user-auth')->plainTextToken;
        UserActivityTracker::touch($user);

        return response()->json([
            'token' => $token,
            'user' => $this->mapUser($user),
            'created' => true,
            'provider' => $data['provider'],
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }

    public function me(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if ($user instanceof User) {
            UserActivityTracker::touch($user);
        }

        return response()->json([
            'user' => $user ? $this->mapUser($user) : null,
        ]);
    }

    public function updateProfile(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            throw ValidationException::withMessages([
                'auth' => ['غير مصرح.'],
            ]);
        }

        $data = $request->validate([
            'name' => ['nullable', 'string', 'min:2', 'max:120'],
            'targetLanguage' => ['nullable', 'string', 'in:en,de,ar'],
            'age' => ['nullable', 'integer', 'min:5', 'max:100'],
            'gender' => ['nullable', 'string', 'in:male,female'],
            'startLevel' => ['nullable', 'string', 'max:100'],
            'avatar' => ['nullable', 'string', 'max:2000000'],
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('targetLanguage', $data)) {
            $user->target_language = $data['targetLanguage'];
        }
        if (array_key_exists('age', $data)) {
            $user->age = $data['age'];
        }
        if (array_key_exists('gender', $data)) {
            $user->gender = $data['gender'];
        }
        if (array_key_exists('startLevel', $data)) {
            $user->start_level = $data['startLevel'];
        }
        if (array_key_exists('avatar', $data)) {
            $user->avatar = $data['avatar'];
        }

        $user->save();
        UserActivityTracker::touch($user);

        return response()->json([
            'message' => 'تم تحديث بيانات الحساب بنجاح',
            'user' => $this->mapUser($user),
        ]);
    }

    public function deleteAccount(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            throw ValidationException::withMessages([
                'auth' => ['غير مصرح.'],
            ]);
        }

        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json([
            'message' => 'تم حذف الحساب نهائياً',
        ]);
    }

    private function mapUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'plan' => $user->plan ?: 'free',
            'planSubscribedAt' => optional($user->plan_subscribed_at)->toISOString(),
            'planExpiresAt' => optional($user->plan_expires_at)->toISOString(),
            'targetLanguage' => $user->target_language ?: 'en',
            'age' => $user->age,
            'gender' => $user->gender,
            'startLevel' => $user->start_level,
        ];
    }
}
