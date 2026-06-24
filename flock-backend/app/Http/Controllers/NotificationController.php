<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{

    /**
     * Fetch paginated notifications along with unread count.
     */
    public function index(Request $request)
    {
        $user = PostController::authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        // Get paginated notifications
        $notifications = $user->notifications()->paginate(20);

        // Transform the notifications to clean up the response
        $transformedNotifications = $notifications->through(function ($notification) {
            return $this->transformNotification($notification);
        });

        // Get the total count of unread notifications
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'success'      => true,
            'unread_count' => $unreadCount,
            'data'         => $transformedNotifications
        ]);
    }

    /**
     * Mark all unread notifications for the user as read.
     */
    public function markAsRead(Request $request)
    {
        $user = PostController::authUser($request);
        if (!$user) return response()->json(['error' => 'Unauthenticated.'], 401);

        // Marks all unread notifications for this user as read
        $user->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.'
        ]);
    }

    /**
     * Transform notification to clean response format
     */
    private function transformNotification(DatabaseNotification $notification)
    {
        $data = $notification->data;

        // Build clean response
        return [
            'id' => $notification->id,
            'type' => $data['type'] ?? 'unknown',
            'sender' => [
                'id' => $data['sender_id'] ?? null,
                'name' => $data['sender_name'] ?? 'Unknown User',
                'avatar' => $data['sender_avatar'] ?? null,
                'username' => $data['sender_username'] ?? 'Unknown Username'
            ],
            'source_id' => $data['source_id'] ?? null, // Added source_id field
            'message' => $data['message'] ?? '',
            'created_at' => $notification->created_at->toISOString(),
            'read_at' => $notification->read_at ? $notification->read_at->toISOString() : null,
            'is_read' => !is_null($notification->read_at),
        ];
    }
}
