<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

trait ResolvesOptionalAppUser
{
    protected function optionalAppUser(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($token);
        $model = $accessToken?->tokenable;

        return $model instanceof User ? $model : null;
    }
}
