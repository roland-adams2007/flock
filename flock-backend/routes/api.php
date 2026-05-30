<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostController;

Route::post('/auth/check-email', [AuthController::class, 'checkEmail']);
Route::get('/auth/check-profile', [AuthController::class, 'checkProfile']);
Route::post('/auth/sync', [AuthController::class, 'sync']);
Route::get('/auth/me', [ProfileController::class, 'me'])->middleware('auth:sanctum');

Route::get('/profile/posts', [PostController::class, 'profilePosts']);
Route::get('/profile/replies', [PostController::class, 'profileReplies']);
Route::get('/profile/likes/posts', [PostController::class, 'profilePostLikes']);
Route::get('/profile/likes/comments', [PostController::class, 'profileCommentLikes']);
Route::get('/profile/reposts', [PostController::class, 'profileReposts']);
Route::get('/profile/{username}', [ProfileController::class, 'show']);
Route::put('/profile/{username}', [ProfileController::class, 'update']);
Route::post('/profile/{username}/follow', [ProfileController::class, 'follow']);
Route::delete('/profile/{username}/follow', [ProfileController::class, 'unfollow']);

Route::post('/posts', [PostController::class, 'store']);
Route::put('/posts/{id}', [PostController::class, 'update']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);
Route::post('/posts/{id}/like', [PostController::class, 'like']);
Route::delete('/posts/{id}/like', [PostController::class, 'unlike']);
Route::post('/posts/{id}/repost', [PostController::class, 'repost']);
Route::post('/posts/{id}/comments', [PostController::class, 'storeComment']);
