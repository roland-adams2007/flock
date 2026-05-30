<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Follower;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{

    public function me(Request $request)
    {

        $user = auth()->user()->load('profile');

        return response()->json([
            'success' => true,
            'data' => [
                'display_name'     => $user->profile?->display_name,
                'avatar'   => $user->profile?->avatar,
                'username' => $user->profile?->username,
            ]
        ], 200);
    }


    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $record = PersonalAccessToken::findToken($token);
        return $record?->tokenable;
    }

    public function show($username, Request $request)
    {
        $authUser = $this->authUser($request);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $username))
            ->with(['profile', 'followers.profile', 'following.profile'])
            ->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        $mine = $authUser && $authUser->id === $user->id;
        $isFollowing = $authUser ? $user->followers()->where('follower_id', $authUser->id)->exists() : false;

        return response()->json([
            'success' => true,
            'mine' => $mine,
            'is_following' => $isFollowing,
            'user' => [
                'username' => $user->profile->username,
                'display_name' => $user->profile->display_name,
                'bio' => $user->profile->bio,
                'avatar' => $user->profile->avatar,
                'website' => $user->profile->website,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
        ]);
    }

    public function update($username, Request $request)
    {
        $authUser = $this->authUser($request);
        if (!$authUser) return response()->json(['error' => 'Unauthenticated.'], 401);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $username))->firstOrFail();

        if ($authUser->id !== $user->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $request->validate([
            'display_name' => 'sometimes|string|max:60',
            'bio' => 'sometimes|nullable|string|max:200',
            'website' => 'sometimes|nullable|string|max:100',
            'avatar' => 'sometimes|nullable|string|max:500',
        ]);

        $user->profile->update($request->only(['display_name', 'bio', 'website', 'avatar']));

        return response()->json([
            'success' => true,
            'profile' => [
                'username' => $user->profile->username,
                'display_name' => $user->profile->display_name,
                'bio' => $user->profile->bio,
                'avatar' => $user->profile->avatar,
                'website' => $user->profile->website,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function follow($username, Request $request)
    {
        $authUser = $this->authUser($request);
        if (!$authUser) return response()->json(['error' => 'Unauthenticated.'], 401);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $username))->firstOrFail();

        if ($authUser->id === $user->id) {
            return response()->json(['error' => 'Cannot follow yourself.'], 422);
        }

        $authUser->following()->syncWithoutDetaching([$user->id]);

        return response()->json(['success' => true]);
    }

    public function unfollow($username, Request $request)
    {
        $authUser = $this->authUser($request);
        if (!$authUser) return response()->json(['error' => 'Unauthenticated.'], 401);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $username))->firstOrFail();

        $authUser->following()->detach($user->id);

        return response()->json(['success' => true]);
    }
}
