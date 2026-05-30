<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    private function decodeSupabaseJwt(string $token): array|null
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        $payload = json_decode(
            base64_decode(strtr($parts[1], '-_', '+/')),
            true
        );

        if (!$payload || empty($payload['sub'])) return null;
        if (isset($payload['exp']) && $payload['exp'] < time()) return null;

        return $payload;
    }

    public function checkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $exists = User::where('email', $request->email)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function checkProfile(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'No token provided.'], 401);
        }

        $payload = $this->decodeSupabaseJwt($token);
        if (!$payload) {
            return response()->json(['error' => 'Invalid token.'], 401);
        }

        $user = User::where('supabase_user_id', $payload['sub'])->first();

        if (!$user || !$user->profile) {
            return response()->json(['has_profile' => false]);
        }

        return response()->json(['has_profile' => true]);
    }

    public function sync(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'No token provided.'], 401);
        }

        $payload = $this->decodeSupabaseJwt($token);
        if (!$payload) {
            return response()->json(['error' => 'Invalid token.'], 401);
        }

        $supabaseId = $payload['sub'];
        $email      = $payload['email'] ?? $request->email;

        $user = User::firstOrCreate(
            ['supabase_user_id' => $supabaseId],
            ['email' => $email]
        );

        if (!$user->profile) {
            Profile::create([
                'user_id'      => $user->id,
                'username'     => $request->username ?? '',
                'display_name' => $request->display_name ?? '',
                'avatar'       => $request->avatar ?? '',
            ]);
        }

        $sanctumToken = $user->createToken('flock')->plainTextToken;

        return response()->json(['token' => $sanctumToken]);
    }

    
}