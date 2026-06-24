<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SocialNotification extends Notification
{
    use Queueable;

    protected $sender;
    protected $type;
    protected $source;

    /**
     * @param $sender - The User model who initiated the action
     * @param string $type - 'follow', 'like', 'repost', or 'reply'
     * @param $source - Optional model instance related to the action (e.g., Post)
     */
    public function __construct($sender, string $type, $source = null)
    {
        $this->sender = $sender;
        $this->type = $type;
        $this->source = $source;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'sender_id'     => $this->sender->id,
            'sender_name'   => $this->sender->profile?->display_name,
            'sender_username' =>  $this->sender->profile?->username,
            'sender_avatar' => $this->sender->profile?->avatar,

            'type'          => $this->type,
            'source_id'     => $this->source ? $this->source->id : null,
            'message'       => $this->getMessage(),
        ];
    }

    protected function getMessage(): string
    {
        return match ($this->type) {
            'follow' => 'started following you.',
            'like'   => 'liked your post.',
            'repost' => 'reposted your post.',
            'reply'  => 'replied to your post.',
            default  => 'interacted with your account.',
        };
    }
}
