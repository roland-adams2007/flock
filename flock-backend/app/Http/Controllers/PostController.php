<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Repost;
use App\Models\User;
use App\Models\Post;
use App\Models\PostMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    private function formatPost(Post $post, ?User $authUser): array
    {
        $isLiked = false;
        $isReposted = false;

        if ($authUser) {
            $isLiked = Like::where('user_id', $authUser->id)
                ->where('likeable_id', $post->id)
                ->where('likeable_type', Post::class)
                ->exists();

            $isReposted = Repost::where('user_id', $authUser->id)
                ->where('post_id', $post->id)
                ->exists();
        }

        return [
            'id'         => $post->id,
            'content'    => $post->content,
            'created_at' => $post->created_at,
            'user'       => [
                'username'     => $post->user->profile->username,
                'display_name' => $post->user->profile->display_name,
                'avatar'       => $post->user->profile->avatar,
            ],
            'media'   => $post->media->map(fn($m) => ['id' => $m->id, 'path' => $m->path, 'type' => $m->type]),
            'counts'  => [
                'likes'    => $post->likes_count,
                'comments' => $post->comments_count,
                'reposts'  => $post->reposts_count,
            ],
            'is_repost'  => !is_null($post->parent_post_id),
            'is_liked'   => $isLiked,
            'is_reposted' => $isReposted,
        ];
    }

    // ─── Media Upload ────────────────────────────────────────────────────────────

    public function uploadMedia(Request $request)
    {
        $user = $this->authUser($request);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in to upload media.',
            ], 401);
        }

        $validator = validator($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi|max:51200',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors()->all();
            // Give a human-friendly message for the most common failures
            $message = 'Invalid file.';
            foreach ($errors as $error) {
                if (str_contains(strtolower($error), 'mimes')) {
                    $message = 'Unsupported file type. Allowed types: JPG, PNG, GIF, WEBP, MP4, MOV, AVI.';
                } elseif (str_contains(strtolower($error), 'max')) {
                    $message = 'File is too large. Maximum allowed size is 50 MB.';
                } elseif (str_contains(strtolower($error), 'required')) {
                    $message = 'No file was provided. Please attach a file and try again.';
                }
            }
            return response()->json([
                'success' => false,
                'message' => $message,
                'errors'  => $errors,
            ], 422);
        }

        try {
            $file = $request->file('file');
            $type = str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image';
            $path = $file->store('media', 's3');

            if (!$path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save the file. Please try again.',
                ], 500);
            }

            $url = Storage::disk('s3')->url($path);

            return response()->json([
                'success' => true,
                'message' => ucfirst($type) . ' uploaded successfully.',
                'url'     => $url,
                'type'    => $type,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while uploading. Please try again.',
            ], 500);
        }
    }

    // ─── Posts ───────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $request->validate(['content' => 'required|string|max:500']);

        $post = Post::create([
            'user_id' => $user->id,
            'content' => $request->content,
        ]);

        if ($request->has('media') && is_array($request->media)) {
            foreach ($request->media as $m) {
                if (!empty($m['url'])) {
                    PostMedia::create([
                        'post_id' => $post->id,
                        'path'     => $m['url'],
                        'type'    => $m['type'] ?? 'image',
                    ]);
                }
            }
        }

        $post->load('user.profile', 'media');
        $post->loadCount(['likes', 'comments', 'reposts']);

        return response()->json([
            'success' => true,
            'post'    => $this->formatPost($post, $user),
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

    // ─── Likes ───────────────────────────────────────────────────────────────────

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
            'user_id'      => $user->id,
            'likeable_id'  => $post->id,
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

    // ─── Reposts ─────────────────────────────────────────────────────────────────

    public function repost(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $post = Post::with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->findOrFail($id);

        $exists = Repost::where('user_id', $user->id)->where('post_id', $post->id)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Already reposted.'], 422);
        }

        Repost::create(['user_id' => $user->id, 'post_id' => $post->id]);

        // Refresh repost count after creating
        $post->loadCount(['likes', 'comments', 'reposts']);

        return response()->json([
            'success' => true,
            'post'    => $this->formatPost($post, $user),
        ]);
    }

    public function unrepost(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        Repost::where('user_id', $user->id)->where('post_id', $id)->delete();

        return response()->json(['success' => true]);
    }

    // ─── Comments ────────────────────────────────────────────────────────────────

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
                'id'         => $comment->id,
                'content'    => $comment->content,
                'created_at' => $comment->created_at,
                'user'       => [
                    'username'     => $comment->user->profile->username,
                    'display_name' => $comment->user->profile->display_name,
                    'avatar'       => $comment->user->profile->avatar,
                ],
            ],
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $authUser = $this->authUser($request);

        $post = Post::with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'post'    => $this->formatPost($post, $authUser),
        ]);
    }

    public function comments(Request $request, $id)
    {
        $authUser = $this->authUser($request);

        Post::findOrFail($id);

        $comments = Comment::where('post_id', $id)
            ->with(['user.profile'])
            ->withCount(['likes', 'reposts'])
            ->latest()
            ->get()
            ->map(function ($comment) use ($authUser) {
                $isLiked = false;
                $isReposted = false;
                if ($authUser) {
                    $isLiked = Like::where('user_id', $authUser->id)
                        ->where('likeable_id', $comment->id)
                        ->where('likeable_type', Comment::class)
                        ->exists();
                    $isReposted = Repost::where('user_id', $authUser->id)
                        ->where('post_id', $comment->id)
                        ->exists();
                }
                return [
                    'id'          => $comment->id,
                    'content'     => $comment->content,
                    'created_at'  => $comment->created_at,
                    'is_liked'    => $isLiked,
                    'is_reposted' => $isReposted,
                    'user'        => [
                        'username'     => $comment->user->profile->username,
                        'display_name' => $comment->user->profile->display_name,
                        'avatar'       => $comment->user->profile->avatar,
                    ],
                    'counts' => [
                        'likes'   => $comment->likes_count,
                        'reposts' => $comment->reposts_count,
                    ],
                ];
            });

        return response()->json(['success' => true, 'comments' => $comments]);
    }

    public function likeComment(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $comment = Comment::findOrFail($id);

        $exists = Like::where('user_id', $user->id)
            ->where('likeable_id', $comment->id)
            ->where('likeable_type', Comment::class)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Already liked.'], 422);
        }

        Like::create([
            'user_id'       => $user->id,
            'likeable_id'   => $comment->id,
            'likeable_type' => Comment::class,
        ]);

        return response()->json(['success' => true]);
    }

    public function unlikeComment(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        Like::where('user_id', $user->id)
            ->where('likeable_id', $id)
            ->where('likeable_type', Comment::class)
            ->delete();

        return response()->json(['success' => true]);
    }

    public function repostComment(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $comment = Comment::findOrFail($id);

        $exists = Repost::where('user_id', $user->id)->where('post_id', $comment->id)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Already reposted.'], 422);
        }

        Repost::create(['user_id' => $user->id, 'post_id' => $comment->id]);

        return response()->json(['success' => true]);
    }

    public function unrepostComment(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        Repost::where('user_id', $user->id)->where('post_id', $id)->delete();

        return response()->json(['success' => true]);
    }

    // ─── Profile Feeds ───────────────────────────────────────────────────────────


    public function profilePosts(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $authUser = $this->authUser($request);
        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $page    = (int) ($request->page ?? 1);
        $perPage = 20;

        // Original posts
        $posts = Post::where('user_id', $user->id)
            ->whereNull('parent_post_id')
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->get()
            ->map(fn($post) => ['_date' => $post->created_at] + $this->formatPost($post, $authUser));

        // Reposted posts — load original and flip is_repost to true
        $repostIds = Repost::where('user_id', $user->id)->pluck('post_id', 'id');
        $repostDates = Repost::where('user_id', $user->id)->pluck('created_at', 'post_id');

        $repostItems = Post::whereIn('id', $repostIds->values())
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->get()
            ->filter(fn($post) => $post !== null)
            ->map(function ($post) use ($authUser, $repostDates) {
                $formatted = $this->formatPost($post, $authUser);
                $formatted['is_repost'] = true;
                $repostedAt = $repostDates[$post->id] ?? $post->created_at;
                return ['_date' => $repostedAt] + $formatted;
            });

        // Merge, sort newest first, paginate
        $merged = $posts->concat($repostItems)->sortByDesc('_date')->values();
        $total  = $merged->count();
        $items  = $merged->forPage($page, $perPage)->values()
            ->map(fn($i) => collect($i)->except('_date')->all());

        return response()->json([
            'success' => true,
            'posts'   => [
                'data'         => $items,
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
    }

    public function profileReplies(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $authUser = $this->authUser($request);
        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $replies = Post::where('user_id', $user->id)
            ->whereNotNull('parent_post_id')
            ->with(['user.profile', 'media', 'parent.user.profile'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(20);

        $replies->getCollection()->transform(function ($post) use ($authUser) {
            $formatted = $this->formatPost($post, $authUser);
            $formatted['reply_to'] = $post->parent ? [
                'id'      => $post->parent->id,
                'content' => $post->parent->content,
                'user'    => [
                    'username'     => $post->parent->user->profile->username,
                    'display_name' => $post->parent->user->profile->display_name,
                    'avatar'       => $post->parent->user->profile->avatar,
                ],
            ] : null;
            return $formatted;
        });

        return response()->json(['success' => true, 'replies' => $replies]);
    }

    public function profilePostLikes(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $authUser = $this->authUser($request);
        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $likedPosts = Post::whereHas('likes', fn($q) => $q->where('user_id', $user->id))
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest()
            ->paginate(20);

        $likedPosts->getCollection()->transform(fn($post) => $this->formatPost($post, $authUser));

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
            'id'         => $comment->id,
            'content'    => $comment->content,
            'created_at' => $comment->created_at,
            'user'       => [
                'username'     => $comment->user->profile->username,
                'display_name' => $comment->user->profile->display_name,
                'avatar'       => $comment->user->profile->avatar,
            ],
            'post'   => ['id' => $comment->post->id, 'content' => $comment->post->content],
            'counts' => ['likes' => $comment->likes_count, 'reposts' => $comment->reposts_count],
        ]);

        return response()->json(['success' => true, 'liked_comments' => $likedComments]);
    }

    /**
     * Returns the posts a user has reposted, with full post data AND repost metadata
     * (who reposted it and when) so the frontend can show "X reposted" banners.
     */
    public function profileReposts(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $authUser = $this->authUser($request);
        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        // Fetch reposts with the original post eagerly loaded
        $reposts = Repost::where('user_id', $user->id)
            ->with([
                'post.user.profile',
                'post.media',
                'user.profile',
            ])
            ->withCount([])   // counts go on the post below
            ->latest()
            ->paginate(20);

        // Load counts on the posts themselves
        $postIds = $reposts->getCollection()->pluck('post_id')->unique()->all();
        $countedPosts = Post::whereIn('id', $postIds)
            ->withCount(['likes', 'comments', 'reposts'])
            ->get()
            ->keyBy('id');

        $reposts->getCollection()->transform(function ($repost) use ($authUser, $countedPosts) {
            $post = $repost->post;

            // Merge the counts we loaded separately into the post model
            if (isset($countedPosts[$post->id])) {
                $counted = $countedPosts[$post->id];
                $post->likes_count    = $counted->likes_count;
                $post->comments_count = $counted->comments_count;
                $post->reposts_count  = $counted->reposts_count;
            }

            return [
                'repost_id'   => $repost->id,
                'reposted_at' => $repost->created_at,
                'reposted_by' => [
                    'username'     => $repost->user->profile->username,
                    'display_name' => $repost->user->profile->display_name,
                    'avatar'       => $repost->user->profile->avatar,
                ],
                'post' => $this->formatPost($post, $authUser),
            ];
        });

        return response()->json(['success' => true, 'reposted_posts' => $reposts]);
    }
}