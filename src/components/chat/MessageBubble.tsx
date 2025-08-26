import { cn } from '@/lib/utils';

export function MessageBubble({
                                  body,
                                  senderName,
                                  isMe,
                                  createdAt,
                              }: {
    body: string;
    senderName?: string;
    isMe: boolean;
    createdAt: string;
}) {
    return (
        <div className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 ring-1 text-sm',
                    isMe
                        ? 'bg-emerald-500/15 ring-emerald-500/25 text-emerald-100'
                        : 'bg-white/5 ring-white/10 text-white/90'
                )}
            >
                {!isMe && senderName && (
                    <div className="text-[11px] mb-0.5 opacity-70">{senderName}</div>
                )}
                <div className="whitespace-pre-wrap break-words">{body}</div>
                <div className="mt-1 text-[10px] opacity-60">
                    {new Date(createdAt).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
