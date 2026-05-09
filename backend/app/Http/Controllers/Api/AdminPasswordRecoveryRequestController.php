<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordRecoveryRequest;

class AdminPasswordRecoveryRequestController extends Controller
{
    public function index()
    {
        $rows = PasswordRecoveryRequest::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PasswordRecoveryRequest $r) => [
                'id' => $r->id,
                'fullName' => $r->full_name,
                'email' => $r->email,
                'phone' => $r->phone,
                'createdAt' => optional($r->created_at)->toISOString(),
            ]);

        return response()->json([
            'requests' => $rows,
        ]);
    }
}
