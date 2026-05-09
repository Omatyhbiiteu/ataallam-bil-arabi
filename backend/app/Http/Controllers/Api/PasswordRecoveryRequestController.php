<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordRecoveryRequest;
use Illuminate\Http\Request;

class PasswordRecoveryRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:64'],
        ]);

        PasswordRecoveryRequest::query()->create([
            'full_name' => trim($data['full_name']),
            'email' => strtolower(trim($data['email'])),
            'phone' => trim($data['phone']),
        ]);

        return response()->json([
            'message' => 'تم استلام طلبك. سيتواصل معك المسؤول قريباً.',
        ]);
    }
}
