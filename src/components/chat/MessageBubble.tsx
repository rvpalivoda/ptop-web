import { cn } from '@/lib/utils';

export function MessageBubble({
                                  body,
                                  senderName,
                                  isMe,
                                  createdAt,
                                  fileURL,
                                  fileType,
                              }: {
    body: string;
    senderName?: string;
    isMe: boolean;
    createdAt: string;
    fileURL?: string;
    fileType?: string;
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
                {fileURL && fileType?.startsWith('image/') && (
                    <img
                        src={fileURL}
                        alt="attachment"
                        className="mt-2 max-w-full rounded"
                    />
                )}
                {fileURL && !fileType?.startsWith('image/') && (
                    <a
                        href={fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs underline break-all inline-block"
                    >
                        {fileURL}
                    </a>
                )}
                <div className="mt-1 text-[10px] opacity-60">
                    {new Date(createdAt).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
