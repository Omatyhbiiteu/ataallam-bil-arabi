<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function index()
    {
        $admins = AdminUser::query()
            ->select('id', 'name', 'email', 'created_at', 'updated_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($admins);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('admin_users', 'email')],
            'password' => ['required', 'string', 'min:6', 'max:120'],
        ]);

        $admin = AdminUser::query()->create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'message' => 'تم إنشاء المسؤول بنجاح',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'created_at' => $admin->created_at,
            ],
        ], 201);
    }

    public function updatePassword(Request $request)
    {
        /** @var AdminUser|null $authAdmin */
        $authAdmin = $request->user();

        if (! $authAdmin) {
            throw ValidationException::withMessages([
                'auth' => ['غير مصرح.'],
            ]);
        }

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', 'max:120'],
        ]);

        if (! Hash::check($data['current_password'], $authAdmin->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['كلمة المرور الحالية غير صحيحة.'],
            ]);
        }

        $authAdmin->password = Hash::make($data['new_password']);
        $authAdmin->save();

        return response()->json([
            'message' => 'تم تحديث كلمة المرور بنجاح',
        ]);
    }

    public function resetPassword(Request $request, AdminUser $adminUser)
    {
        $data = $request->validate([
            'new_password' => ['required', 'string', 'min:6', 'max:120'],
        ]);

        $adminUser->password = Hash::make($data['new_password']);
        $adminUser->save();

        return response()->json([
            'message' => 'تم تغيير كلمة المرور للمسؤول',
        ]);
    }

    public function destroy(Request $request, AdminUser $adminUser)
    {
        /** @var AdminUser|null $authAdmin */
        $authAdmin = $request->user();

        if ($authAdmin && (int) $authAdmin->id === (int) $adminUser->id) {
            throw ValidationException::withMessages([
                'admin' => ['لا يمكنك حذف حسابك الحالي.'],
            ]);
        }

        $adminUser->tokens()->delete();
        $adminUser->delete();

        return response()->json([
            'message' => 'تم حذف المسؤول بنجاح',
        ]);
    }
}
