<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Repost;
use App\Models\User;
use App\Models\Post;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class PostController extends Controller
{
    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        $record = PersonalAccessToken::findToken($token);
        return $record?->tokenable;
    }

    public function store(Request $request)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $request->validate(['content' => 'required|string|max:500']);

        $post = Post::create([
            'user_id' => $user->id,
            'content' => $request->content,
        ]);

        $post->load('user.profile', 'media');
        $post->loadCount(['likes', 'comments', 'reposts']);

        return response()->json([
            'success' => true,
            'post' => [
                'id' => $post->id,
                'content' => $post->content,
                'created_at' => $post->created_at,
                'user' => [
                    'username' => $post->user->profile->username,
                    'display_name' => $post->user->profile->display_name,
                    'avatar' => $post->user->profile->avatar,
                ],
                'media' => [],
                'counts' => [
                    'likes' => 0,
                    'comments' => 0,
                    'reposts' => 0,
                ],
                'is_repost' => false,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $post = Post::findOrFail($id);

        if ($post->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $request->validate(['content' => 'required|string|max:500']);

        $post->update(['content' => $request->content]);

        return response()->json(['success' => true, 'post' => ['id' => $post->id, 'content' => $post->content]]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $post = Post::findOrFail($id);

        if ($post->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $post->delete();

        return response()->json(['success' => true]);
    }

    public function like(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $post = Post::findOrFail($id);

        $exists = Like::where('user_id', $user->id)
            ->where('likeable_id', $post->id)
            ->where('likeable_type', Post::class)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Already liked.'], 422);
        }

        Like::create([
            'user_id' => $user->id,
            'likeable_id' => $post->id,
            'likeable_type' => Post::class,
        ]);

        return response()->json(['success' => true]);
    }

    public function unlike(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        Like::where('user_id', $user->id)
            ->where('likeable_id', $id)
            ->where('likeable_type', Post::class)
            ->delete();

        return response()->json(['success' => true]);
    }

    public function repost(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $post = Post::findOrFail($id);

        $exists = Repost::where('user_id', $user->id)->where('post_id', $post->id)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Already reposted.'], 422);
        }

        Repost::create(['user_id' => $user->id, 'post_id' => $post->id]);

        return response()->json(['success' => true]);
    }

    public function storeComment(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $post = Post::findOrFail($id);

        $request->validate(['content' => 'required|string|max:500']);

        $comment = Comment::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
            'content' => $request->content,
        ]);

        $comment->load('user.profile');

        return response()->json([
            'success' => true,
            'comment' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'user' => [
                    'username' => $comment->user->profile->username,
                    'display_name' => $comment->user->profile->display_name,
                    'avatar' => $comment->user->profile->avatar,
                ],
            ],
        ], 201);
    }

    public function profilePosts(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $posts = Post::where('user_id', $user->id)
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(20);

        $posts->getCollection()->transform(fn($post) => [
            'id' => $post->id,
            'content' => $post->content,
            'created_at' => $post->created_at,
            'user' => [
                'username' => $post->user->profile->username,
                'display_name' => $post->user->profile->display_name,
                'avatar' => $post->user->profile->avatar,
            ],
            'media' => $post->media->map(fn($m) => ['id' => $m->id, 'url' => $m->url, 'type' => $m->type]),
            'counts' => ['likes' => $post->likes_count, 'comments' => $post->comments_count, 'reposts' => $post->reposts_count],
            'is_repost' => !is_null($post->parent_post_id),
        ]);

        return response()->json(['success' => true, 'posts' => $posts]);
    }

    public function profileReplies(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $replies = Post::where('user_id', $user->id)
            ->whereNotNull('parent_post_id')
            ->with(['user.profile', 'media', 'parent.user.profile'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(20);

        $replies->getCollection()->transform(fn($post) => [
            'id' => $post->id,
            'content' => $post->content,
            'created_at' => $post->created_at,
            'user' => [
                'username' => $post->user->profile->username,
                'display_name' => $post->user->profile->display_name,
                'avatar' => $post->user->profile->avatar,
            ],
            'media' => $post->media->map(fn($m) => ['id' => $m->id, 'url' => $m->url, 'type' => $m->type]),
            'counts' => ['likes' => $post->likes_count, 'comments' => $post->comments_count, 'reposts' => $post->reposts_count],
            'reply_to' => $post->parent ? [
                'id' => $post->parent->id,
                'content' => $post->parent->content,
                'user' => [
                    'username' => $post->parent->user->profile->username,
                    'display_name' => $post->parent->user->profile->display_name,
                    'avatar' => $post->parent->user->profile->avatar,
                ],
            ] : null,
        ]);

        return response()->json(['success' => true, 'replies' => $replies]);
    }

    public function profilePostLikes(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $likedPosts = Post::whereHas('likes', fn($q) => $q->where('user_id', $user->id))
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(20);

        $likedPosts->getCollection()->transform(fn($post) => [
            'id' => $post->id,
            'content' => $post->content,
            'created_at' => $post->created_at,
            'user' => [
                'username' => $post->user->profile->username,
                'display_name' => $post->user->profile->display_name,
                'avatar' => $post->user->profile->avatar,
            ],
            'media' => $post->media->map(fn($m) => ['id' => $m->id, 'url' => $m->url, 'type' => $m->type]),
            'counts' => ['likes' => $post->likes_count, 'comments' => $post->comments_count, 'reposts' => $post->reposts_count],
            'is_repost' => !is_null($post->parent_post_id),
        ]);

        return response()->json(['success' => true, 'liked_posts' => $likedPosts]);
    }

    public function profileCommentLikes(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $likedComments = Comment::whereHas('likes', fn($q) => $q->where('user_id', $user->id))
            ->with(['user.profile', 'post'])
            ->withCount(['likes', 'reposts'])
            ->latest()
            ->paginate(20);

        $likedComments->getCollection()->transform(fn($comment) => [
            'id' => $comment->id,
            'content' => $comment->content,
            'created_at' => $comment->created_at,
            'user' => [
                'username' => $comment->user->profile->username,
                'display_name' => $comment->user->profile->display_name,
                'avatar' => $comment->user->profile->avatar,
            ],
            'post' => ['id' => $comment->post->id, 'content' => $comment->post->content],
            'counts' => ['likes' => $comment->likes_count, 'reposts' => $comment->reposts_count],
        ]);

        return response()->json(['success' => true, 'liked_comments' => $likedComments]);
    }

    public function profileReposts(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $repostedPosts = Post::whereHas('reposts', fn($q) => $q->where('user_id', $user->id))
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(20);

        $repostedPosts->getCollection()->transform(fn($post) => [
            'id' => $post->id,
            'content' => $post->content,
            'created_at' => $post->created_at,
            'user' => [
                'username' => $post->user->profile->username,
                'display_name' => $post->user->profile->display_name,
                'avatar' => $post->user->profile->avatar,
            ],
            'media' => $post->media->map(fn($m) => ['id' => $m->id, 'url' => $m->url, 'type' => $m->type]),
            'counts' => ['likes' => $post->likes_count, 'comments' => $post->comments_count, 'reposts' => $post->reposts_count],
        ]);

        return response()->json(['success' => true, 'reposted_posts' => $repostedPosts]);
    }
}