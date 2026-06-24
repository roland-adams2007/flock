<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Notifications\SocialNotification;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $record = PersonalAccessToken::findToken($token);
        return $record?->tokenable;
    }

    public function me(Request $request)
    {
        $user = auth()->user()->load('profile');

        return response()->json([
            'success' => true,
            'data' => [
                'display_name' => $user->profile?->display_name,
                'avatar' => $user->profile?->avatar,
                'username' => $user->profile?->username,
            ]
        ], 200);
    }

    public function show($username, Request $request)
    {
        $authUser = $this->authUser($request);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $username))
            ->with(['profile'])
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

    public function followers($username, Request $request)
    {
        $authUser = $this->authUser($request);

        $user = User::whereHas('profile', function ($q) use ($username) {
            $q->where('username', $username);
        })->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $followers = $user->followers()
            ->with('profile')
            ->get()
            ->map(function ($follower) use ($authUser) {

                $isFollowing = $authUser
                    ? $authUser->following()
                    ->where('following_id', $follower->id)
                    ->exists()
                    : false;

                return [
                    'username' => $follower->profile->username,
                    'display_name' => $follower->profile->display_name,
                    'avatar' => $follower->profile->avatar,
                    'bio' => $follower->profile->bio,
                    'is_following' => $isFollowing,
                    'is_me' => $authUser ? $authUser->id === $follower->id : false,
                ];
            });

        return response()->json([
            'success' => true,
            'followers' => $followers
        ]);
    }

    public function following($username, Request $request)
    {
        $authUser = $this->authUser($request);

        $user = User::whereHas('profile', function ($q) use ($username) {
            $q->where('username', $username);
        })->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $following = $user->following()
            ->with('profile')
            ->get()
            ->map(function ($followedUser) use ($authUser) {

                $isFollowing = $authUser
                    ? $authUser->following()
                    ->where('following_id', $followedUser->id)
                    ->exists()
                    : false;

                return [
                    'username' => $followedUser->profile->username,
                    'display_name' => $followedUser->profile->display_name,
                    'avatar' => $followedUser->profile->avatar,
                    'bio' => $followedUser->profile->bio,
                    'is_following' => $isFollowing,
                    'is_me' => $authUser ? $authUser->id === $followedUser->id : false,
                ];
            });

        return response()->json([
            'success' => true,
            'following' => $following
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

        $user->notify(new SocialNotification($authUser, 'follow'));

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

    public function peopleToFollow(Request $request)
    {
        $authUser = $this->authUser($request);

        $followingIds = $authUser->following()->pluck('following_id')->toArray();

        $suggestedUsers = User::whereNotIn('id', array_merge($followingIds, [$authUser->id]))
            ->with('profile')
            ->inRandomOrder()
            ->limit(5)
            ->get()
            ->map(function ($user) use ($authUser) {
                $isFollowing = $authUser
                    ? $authUser->following()
                    ->where('following_id', $user->id)
                    ->exists()
                    : false;

                return [
                    'username' => $user->profile->username,
                    'display_name' => $user->profile->display_name,
                    'avatar' => $user->profile->avatar,
                    'is_following' => $isFollowing,
                ];
            });

        return response()->json([
            'success' => true,
            'suggested_users' => $suggestedUsers
        ]);
    }
}
