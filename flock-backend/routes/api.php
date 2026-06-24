<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\NotificationController;

Route::get('/wake', function () {
    try {
        DB::select('select 1');
        return response()->json([
            'success' => true,
            'awake'   => true,
            'time'    => now()->toIso8601String(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'awake'   => false,
        ], 500);
    }
});

Route::post('/auth/check-email', [AuthController::class, 'checkEmail']);
Route::get('/auth/check-profile', [AuthController::class, 'checkProfile']);
Route::post('/auth/sync', [AuthController::class, 'sync']);
Route::get('/auth/me', [ProfileController::class, 'me'])->middleware('auth:sanctum');

Route::get('/feed', [PostController::class, 'feed']);

Route::get('/profile/posts', [PostController::class, 'profilePosts']);
Route::get('/profile/replies', [PostController::class, 'profileReplies']);
Route::get('/profile/likes/posts', [PostController::class, 'profilePostLikes']);
Route::get('/profile/reposts', [PostController::class, 'profileReposts']);
Route::get('/profile/people-to-follow', [ProfileController::class, 'peopleToFollow']);
Route::get('/profile/{username}', [ProfileController::class, 'show']);
Route::put('/profile/{username}', [ProfileController::class, 'update']);
Route::post('/profile/{username}/follow', [ProfileController::class, 'follow']);
Route::delete('/profile/{username}/follow', [ProfileController::class, 'unfollow']);
Route::get('/profile/{username}/followers', [ProfileController::class, 'followers']);
Route::get('/profile/{username}/following', [ProfileController::class, 'following']);


Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::get('/posts/{id}/replies', [PostController::class, 'replies']);
Route::post('/posts/{id}/replies', [PostController::class, 'storeReply']);
Route::put('/posts/{id}', [PostController::class, 'update']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);
Route::post('/posts/{id}/like', [PostController::class, 'like']);
Route::delete('/posts/{id}/like', [PostController::class, 'unlike']);
Route::post('/posts/{id}/repost', [PostController::class, 'repost']);
Route::delete('/posts/{id}/repost', [PostController::class, 'unrepost']);

Route::post('/media/upload', [PostController::class, 'uploadMedia']);




Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead']);
