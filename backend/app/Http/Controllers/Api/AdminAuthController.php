<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $this->ensureBootstrapAdmin();

        $admin = AdminUser::where('email', strtolower($data['email']))->first();

        if (! $admin || ! Hash::check($data['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الدخول غير صحيحة.'],
            ]);
        }

        $token = $admin->createToken('admin-panel')->plainTextToken;

        return response()->json([
            'token' => $token,
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }

    private function ensureBootstrapAdmin(): void
    {
        if (AdminUser::query()->exists()) {
            return;
        }

        $email = strtolower((string) env('ADMIN_BOOTSTRAP_EMAIL', 'admin@et3alem.local'));
        $password = (string) env('ADMIN_BOOTSTRAP_PASSWORD', 'change-this-admin-password');
        $name = (string) env('ADMIN_BOOTSTRAP_NAME', 'Super Admin');

        AdminUser::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);
    }
}
