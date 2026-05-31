<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Repost;
use App\Models\User;
use App\Models\Post;
use App\Models\PostMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use Intervention\Image\Laravel\Facades\Image;

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
            'id'             => $post->id,
            'content'        => $post->content,
            'created_at'     => $post->created_at,
            'parent_post_id' => $post->parent_post_id,
            'user'           => [
                'username'     => $post->user->profile->username,
                'display_name' => $post->user->profile->display_name,
                'avatar'       => $post->user->profile->avatar,
            ],
            'media'      => $post->media->map(fn($m) => ['id' => $m->id, 'path' => $m->path, 'type' => $m->type]),
            'counts'     => [
                'likes'   => $post->likes_count,
                'replies' => $post->replies_count,
                'reposts' => $post->reposts_count,
            ],
            'is_reply'    => !is_null($post->parent_post_id),
            'is_liked'    => $isLiked,
            'is_reposted' => $isReposted,
        ];
    }

    // public function uploadMedia(Request $request)
    // {
    //     $user = $this->authUser($request);
    //     if (!$user) {
    //         return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
    //     }

    //     $validator = validator($request->all(), [
    //         'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi|max:51200',
    //     ]);

    //     if ($validator->fails()) {
    //         $errors = $validator->errors()->all();
    //         $message = 'Invalid file.';
    //         foreach ($errors as $error) {
    //             if (str_contains(strtolower($error), 'mimes')) {
    //                 $message = 'Unsupported file type. Allowed: JPG, PNG, GIF, WEBP, MP4, MOV, AVI.';
    //             } elseif (str_contains(strtolower($error), 'max')) {
    //                 $message = 'File too large. Max 50 MB.';
    //             } elseif (str_contains(strtolower($error), 'required')) {
    //                 $message = 'No file provided.';
    //             }
    //         }
    //         return response()->json(['success' => false, 'message' => $message, 'errors' => $errors], 422);
    //     }

    //     try {
    //         $file = $request->file('file');
    //         $type = str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image';
    //         $path = $file->store('media', 's3');

    //         if (!$path) {
    //             return response()->json(['success' => false, 'message' => 'Failed to save file.'], 500);
    //         }

    //         $url = Storage::disk('s3')->url($path);

    //         return response()->json(['success' => true, 'url' => $url, 'type' => $type], 201);
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => 'Upload failed.'], 500);
    //     }
    // }

    public function uploadMedia(Request $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = validator($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,mov,avi|max:51200',
        ], [
            'file.required' => 'No file provided.',
            'file.mimes'    => 'Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, MP4, MOV, AVI.',
            'file.max'      => 'File too large. Max 50 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first('file'),
                'errors'  => $validator->errors()->all(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $mimeType = $file->getMimeType();
            $isImage = str_starts_with($mimeType, 'image/');
            $type = $isImage ? 'image' : 'video';

            $uniqueId = uniqid('', true);
            $disk = Storage::disk('s3');

            if ($isImage) {
                // If it's a GIF, don't re-encode it to JPEG (which destroys animation)
                if ($mimeType === 'image/gif') {
                    $path = "media/{$uniqueId}.gif";
                    $disk->putFileAs('media', $file, "{$uniqueId}.gif", [
                        'visibility'   => 'public',
                        'CacheControl' => 'public, max-age=31536000',
                        'ContentType'  => 'image/gif',
                    ]);
                } else {
                    // Convert PNG, WebP, and standard JPEGs into highly optimized JPEGs
                    $processed = Image::read($file)
                        ->scaleDown(width: 1920)
                        ->toJpeg(80);

                    $path = "media/{$uniqueId}.jpg";

                    $disk->put($path, (string) $processed, [
                        'visibility'   => 'public',
                        'CacheControl' => 'public, max-age=31536000',
                        'ContentType'  => 'image/jpeg',
                    ]);
                }

                $finalUrl = $disk->url($path);
            } else {
                // Handle all your allowed video formats natively (mp4, webm, ogg, quicktime)
                $extension = strtolower($file->getClientOriginalExtension());

                // Fallback extension check if clientOriginalExtension comes back empty
                if (empty($extension)) {
                    $extension = match ($mimeType) {
                        'video/quicktime' => 'mov',
                        'video/webm' => 'webm',
                        'video/ogg' => 'ogv',
                        default => 'mp4',
                    };
                }

                $path = "media/{$uniqueId}.{$extension}";

                $disk->putFileAs('media', $file, "{$uniqueId}.{$extension}", [
                    'visibility'   => 'public',
                    'CacheControl' => 'public, max-age=31536000',
                    'ContentType'  => $mimeType,
                ]);

                $finalUrl = $disk->url($path);
            }

            return response()->json([
                'success' => true,
                'url'     => $finalUrl,
                'type'    => $type,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed.',
            ], 500);
        }
    }



    public function store(Request $request)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        $request->validate([
            'content'        => 'required|string|max:500',
            'parent_post_id' => 'nullable|integer|exists:posts,id',
        ]);

        $post = Post::create([
            'user_id'        => $user->id,
            'content'        => $request->content,
            'parent_post_id' => $request->parent_post_id ?? null,
        ]);

        if ($request->has('media') && is_array($request->media)) {
            foreach ($request->media as $m) {
                if (!empty($m['url'])) {
                    PostMedia::create([
                        'post_id' => $post->id,
                        'path'    => $m['url'],
                        'type'    => $m['type'] ?? 'image',
                    ]);
                }
            }
        }

        $post->load('user.profile', 'media');
        $post->loadCount(['likes', 'replies', 'reposts']);

        return response()->json([
            'success' => true,
            'post'    => $this->formatPost($post, $user),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $authUser = $this->authUser($request);

        $post = Post::with(['user.profile', 'media'])
            ->withCount(['likes', 'replies', 'reposts'])
            ->findOrFail($id);

        $parent = null;
        if ($post->parent_post_id) {
            $parentPost = Post::with(['user.profile', 'media'])
                ->withCount(['likes', 'replies', 'reposts'])
                ->find($post->parent_post_id);
            if ($parentPost) {
                $parent = $this->formatPost($parentPost, $authUser);
            }
        }

        return response()->json([
            'success' => true,
            'post'    => $this->formatPost($post, $authUser),
            'parent'  => $parent,
        ]);
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

    public function replies(Request $request, $id)
    {
        $authUser = $this->authUser($request);

        Post::findOrFail($id);

        $page    = (int) ($request->query('page', 1));
        $perPage = 20;

        $paginator = Post::where('parent_post_id', $id)
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'replies', 'reposts'])
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);

        $paginator->getCollection()->transform(fn($post) => $this->formatPost($post, $authUser));

        return response()->json([
            'success'  => true,
            'comments' => $paginator->items(),
            'meta'     => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => $perPage,
            ],
        ]);
    }

    public function storeReply(Request $request, $id)
    {
        $user = $this->authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        Post::findOrFail($id);

        $request->validate([
            'content' => 'required|string|max:500',
            'media'   => 'nullable|array|max:4',
            'media.*.url'  => 'required_with:media|string|url',
            'media.*.type' => 'required_with:media|in:image,video',
        ]);

        $reply = Post::create([
            'user_id'        => $user->id,
            'content'        => $request->content,
            'parent_post_id' => $id,
        ]);

        if ($request->has('media') && is_array($request->media)) {
            foreach ($request->media as $m) {
                if (!empty($m['url'])) {
                    PostMedia::create([
                        'post_id' => $reply->id,
                        'path'    => $m['url'],
                        'type'    => $m['type'] ?? 'image',
                    ]);
                }
            }
        }

        $reply->load('user.profile', 'media');
        $reply->loadCount(['likes', 'replies', 'reposts']);

        return response()->json([
            'success' => true,
            'comment' => $this->formatPost($reply, $user),
        ], 201);
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
            'user_id'       => $user->id,
            'likeable_id'   => $post->id,
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

        $post = Post::with(['user.profile', 'media'])
            ->withCount(['likes', 'replies', 'reposts'])
            ->findOrFail($id);

        $exists = Repost::where('user_id', $user->id)->where('post_id', $post->id)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Already reposted.'], 422);
        }

        Repost::create(['user_id' => $user->id, 'post_id' => $post->id]);
        $post->loadCount(['likes', 'replies', 'reposts']);

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

    public function feed(Request $request)
    {
        $authUser = $this->authUser($request);
        $page     = (int) ($request->query('page', 1));
        $perPage  = 20;

        // 1. Guest Feed: Simple chronological fallback
        if (!$authUser) {
            $posts = Post::with(['user.profile', 'media'])
                ->withCount(['likes', 'replies', 'reposts'])
                ->whereNull('parent_post_id')
                ->latest()
                ->paginate($perPage, ['*'], 'page', $page);

            $posts->getCollection()->transform(fn($post) => $this->formatPost($post, null));

            return response()->json([
                'success' => true,
                'posts'   => $posts->items(),
                'meta'    => [
                    'current_page' => $posts->currentPage(),
                    'last_page'    => $posts->lastPage(),
                    'total'        => $posts->total(),
                    'per_page'     => $perPage,
                ],
            ]);
        }


        $followingIds = $authUser->following()->pluck('users.id')->toArray();
        $followingIdsList = !empty($followingIds) ? implode(',', array_map('intval', $followingIds)) : '0';

        // 3. PostgreSQL Main Query Execution
        $posts = Post::query()
            // FIX: Put select and selectRaw FIRST so withCount can append to them safely
            ->select('posts.*')
            ->selectRaw("
            (
                (
                    ((SELECT COUNT(*) FROM likes WHERE likes.likeable_id = posts.id AND likes.likeable_type = 'App\\\\Models\\\\Post') * 3) +
                    ((SELECT COUNT(*) FROM posts AS replies WHERE replies.parent_post_id = posts.id) * 5) +
                    ((SELECT COUNT(*) FROM reposts WHERE reposts.post_id = posts.id) * 8)
                ) / 
                GREATEST(EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 3600, 1.0)
            ) + (CASE WHEN posts.user_id IN ($followingIdsList) THEN 10.0 ELSE 0.0 END) AS algo_score
        ")
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'replies', 'reposts']) // Laravel now appends likes_count, replies_count, etc. safely
            ->whereNull('parent_post_id')
            // Enforce the overlapping time windows (Trending vs Following)
            ->where(function ($q) use ($followingIds) {
                $q->where('created_at', '>=', now()->subDays(3)); // Trending window
                if (!empty($followingIds)) {
                    $q->orWhere(function ($sub) use ($followingIds) {
                        $sub->whereIn('user_id', $followingIds)
                            ->where('created_at', '>=', now()->subDays(7)); // Following window
                    });
                }
            })
            ->orderByDesc('algo_score')
            ->paginate($perPage, ['*'], 'page', $page);

        // 4. Transform only the 20 fetched items
        $posts->getCollection()->transform(fn($post) => $this->formatPost($post, $authUser));

        return response()->json([
            'success' => true,
            'posts'   => $posts->items(),
            'meta'    => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'total'        => $posts->total(),
                'per_page'     => $perPage,
            ],
        ]);
    }


    public function profilePosts(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $authUser = $this->authUser($request);
        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $page    = (int) ($request->page ?? 1);
        $perPage = 20;

        $posts = Post::where('user_id', $user->id)
            ->whereNull('parent_post_id')
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'replies', 'reposts'])
            ->get()
            ->map(fn($post) => ['_date' => $post->created_at] + $this->formatPost($post, $authUser));

        $repostIds   = Repost::where('user_id', $user->id)->pluck('post_id', 'id');
        $repostDates = Repost::where('user_id', $user->id)->pluck('created_at', 'post_id');

        $repostItems = Post::whereIn('id', $repostIds->values())
            ->with(['user.profile', 'media'])
            ->withCount(['likes', 'replies', 'reposts'])
            ->get()
            ->filter(fn($post) => $post !== null)
            ->map(function ($post) use ($authUser, $repostDates) {
                $formatted = $this->formatPost($post, $authUser);
                $formatted['is_repost'] = true;
                $repostedAt = $repostDates[$post->id] ?? $post->created_at;
                $formatted['created_at'] = $repostedAt;
                return ['_date' => $repostedAt] + $formatted;
            });

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
            ->withCount(['likes', 'replies', 'reposts'])
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
            ->withCount(['likes', 'replies', 'reposts'])
            ->latest()
            ->paginate(20);

        $likedPosts->getCollection()->transform(fn($post) => $this->formatPost($post, $authUser));

        return response()->json(['success' => true, 'liked_posts' => $likedPosts]);
    }

    public function profileReposts(Request $request)
    {
        $request->validate(['username' => 'required|string', 'page' => 'integer|min:1']);

        $authUser = $this->authUser($request);
        $user = User::whereHas('profile', fn($q) => $q->where('username', $request->username))->firstOrFail();

        $reposts = Repost::where('user_id', $user->id)
            ->with(['post.user.profile', 'post.media', 'user.profile'])
            ->latest()
            ->paginate(20);

        $postIds = $reposts->getCollection()->pluck('post_id')->unique()->all();
        $countedPosts = Post::whereIn('id', $postIds)
            ->withCount(['likes', 'replies', 'reposts'])
            ->get()
            ->keyBy('id');

        $reposts->getCollection()->transform(function ($repost) use ($authUser, $countedPosts) {
            $post = $repost->post;
            if (isset($countedPosts[$post->id])) {
                $counted = $countedPosts[$post->id];
                $post->likes_count   = $counted->likes_count;
                $post->replies_count = $counted->replies_count;
                $post->reposts_count = $counted->reposts_count;
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
