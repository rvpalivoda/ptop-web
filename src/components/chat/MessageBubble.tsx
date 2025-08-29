import { cn } from '@/lib/utils'
import {
    FileText,
    File as FileIcon,
    Image as ImageIcon,
    Download,
    ExternalLink,
    Check,
    CheckCheck,
    Copy,
} from 'lucide-react'
import { useMemo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type MessageBubbleProps = {
    body: string
    senderName?: string
    isMe: boolean
    createdAt: string | Date
    fileURL?: string
    fileType?: string
    /** Optional: bytes */
    fileSize?: number
    /** Optional: when provided, images open in a lightbox */
    onImageClick?: (src: string) => void
    /** ISO string when peer read the message (only matters for isMe) */
    readAt?: string
    /** Compact mode (hide sender line for own messages) */
    compact?: boolean
    /** Ref на внешний контейнер пузыря (для IO, измерений и т.п.) */
    containerRef?: (el: HTMLDivElement | null) => void
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function getFileKind(mime?: string | null, name?: string | null): 'image' | 'pdf' | 'file' {
    if (!mime && name?.toLowerCase().endsWith('.pdf')) return 'pdf'
    if (mime === 'application/pdf') return 'pdf'
    if (mime && IMAGE_MIMES.includes(mime)) return 'image'
    return 'file'
}

function KindIcon({ kind }: { kind: 'image' | 'pdf' | 'file' }) {
    if (kind === 'image') return <ImageIcon className="h-4 w-4" />
    if (kind === 'pdf') return <FileText className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
}

function extractFilename(url?: string): string | undefined {
    if (!url) return undefined
    try {
        const u = new URL(url)
        // try common query keys first
        const nameFromQuery = u.searchParams.get('filename') || u.searchParams.get('name')
        if (nameFromQuery) return decodeURIComponent(nameFromQuery)
        const path = u.pathname.split('/').filter(Boolean)
        return decodeURIComponent(path[path.length - 1] ?? '') || undefined
    } catch {
        // fallback for relative URLs
        const path = url.split('?')[0]?.split('/')
        return path?.[path.length - 1]
    }
}

function prettySize(bytes?: number) {
    if (!bytes && bytes !== 0) return undefined
    if (!Number.isFinite(bytes)) return undefined
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let n = bytes
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024
        i++
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

/** lightweight linkifier for http(s) + www.  */
function linkify(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)|((?:^|\s)www\.[^\s]+)/gi
    const parts: Array<string | JSX.Element> = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    const str = text
    while ((match = urlRegex.exec(str)) !== null) {
        if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index))
        const raw = match[0].trim()
        const href = raw.startsWith('http') ? raw : `https://${raw}`
        parts.push(
            <a
                key={`${match.index}-${href}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-white/30 underline-offset-2 hover:decoration-white break-all"
            >
                {raw}
            </a>
        )
        lastIndex = urlRegex.lastIndex
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex))
    return parts
}

export function MessageBubble({
                                  body,
                                  senderName,
                                  isMe,
                                  createdAt,
                                  fileURL,
                                  fileType,
                                  fileSize,
                                  onImageClick,
                                  readAt,
                                  compact,
                                  containerRef,
                              }: MessageBubbleProps) {
    const { t, i18n } = useTranslation()
    const [copied, setCopied] = useState(false)

    const filename = useMemo(() => extractFilename(fileURL), [fileURL])
    const kind = useMemo(() => getFileKind(fileType, filename), [fileType, filename])
    const created = useMemo(() => new Date(createdAt), [createdAt])

    const timeFmt = useMemo(
        () =>
            new Intl.DateTimeFormat(i18n.language || undefined, {
                hour: '2-digit',
                minute: '2-digit',
            }),
        [i18n.language]
    )
    const fullFmt = useMemo(
        () =>
            new Intl.DateTimeFormat(i18n.language || undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: undefined,
            }),
        [i18n.language]
    )

    const onCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(body)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
        } catch {
            // ignore
        }
    }, [body])

    // bubble visual tokens
    const bubbleBase =
        'relative max-w-[85%] sm:max-w-[72%] rounded-2xl px-3 py-2 text-sm ring-1 transition shadow-sm'
    const bubbleMine =
        'bg-emerald-500/18 text-white ring-emerald-300/15 backdrop-blur-[1px] hover:ring-emerald-300/30'
    const bubblePeer =
        'bg-gray-900/70 text-white/90 ring-white/10 backdrop-blur-[2px] hover:ring-white/20'
    const bubbleCorners = isMe ? 'rounded-br-md' : 'rounded-bl-md'

    return (
        <div ref={containerRef} className={cn('flex w-full px-3 sm:px-4 md:px-6', isMe ? 'justify-end' : 'justify-start')}>
            <div className={cn(bubbleBase, isMe ? bubbleMine : bubblePeer, bubbleCorners)}>
                {/* header (sender) */}
                {!compact && (
                    <div className={cn('mb-0.5 flex items-center gap-2 text-[11px] opacity-70')}>
            <span className="truncate max-w-[240px]">
              {senderName || (isMe ? t('orderChat.youShort') : t('orderChat.peerShort'))}
            </span>

                        {/* small toolbar (copy) appears on hover for text messages */}
                        {body && (
                            <button
                                onClick={onCopy}
                                className={cn(
                                    'ml-auto hidden items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]',
                                    'ring-1 ring-white/10 hover:bg-white/10 group-hover:flex sm:group-hover:inline-flex'
                                )}
                                aria-label={t('orderChat.copy')}
                                title={copied ? t('orderChat.copied') : t('orderChat.copy')}
                            >
                                <Copy className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{copied ? t('orderChat.copied') : t('orderChat.copy')}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* body text */}
                {body && (
                    <div className="group whitespace-pre-wrap break-words selection:bg-white/20">
                        {linkify(body)}
                    </div>
                )}

                {/* attachment: image */}
                {fileURL && kind === 'image' && (
                    <button
                        type="button"
                        onClick={() => onImageClick?.(fileURL)}
                        className={cn(
                            'mt-2 block overflow-hidden rounded-xl ring-1 ring-white/10',
                            'hover:ring-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                        )}
                        title={filename ?? 'image'}
                        aria-label={t('orderChat.openImage')}
                    >
                        <img
                            src={fileURL}
                            alt={filename ?? 'attachment'}
                            className="max-h-80 w-full object-contain cursor-zoom-in bg-black/10"
                            loading="lazy"
                        />
                    </button>
                )}

                {/* attachment: file/pdf */}
                {fileURL && kind !== 'image' && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 p-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                            <KindIcon kind={kind} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs" title={filename ?? fileURL}>
                                {filename ?? fileURL}
                            </div>
                            <div className="text-[11px] text-white/60">
                                {fileType ?? 'file'}
                                {fileSize !== undefined && (
                                    <span className="ml-1">· {prettySize(fileSize)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <a
                                href={fileURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/10"
                                title={t('orderChat.open')}
                                aria-label={t('orderChat.open')}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <a
                                href={fileURL}
                                download={filename}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/10"
                                title={t('orderChat.download')}
                                aria-label={t('orderChat.download')}
                            >
                                <Download className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>
                )}

                {/* status line: time + simple checks (icons only) */}
                <div
                    className={cn(
                        'mt-1 flex items-center gap-2 text-[10px]',
                        isMe ? 'justify-end text-white/90' : 'justify-between text-white/80'
                    )}
                    title={fullFmt.format(created)}
                    aria-label={fullFmt.format(created)}
                >
                    {!isMe && <span className="opacity-80">{timeFmt.format(created)}</span>}
                    {isMe && (
                        readAt ? (
                            <CheckCheck className="h-4 w-4 text-emerald-400" />
                        ) : (
                            <Check className="h-4 w-4 text-sky-400" />
                        )
                    )}
                    {isMe && <span className="opacity-90">{timeFmt.format(created)}</span>}
                </div>

                {/* bubble tail accent (subtle) */}
                <span
                    aria-hidden
                    className={cn(
                        'absolute bottom-0 h-2 w-2 rotate-45',
                        isMe
                            ? 'right-1 bg-emerald-500/18'
                            : 'left-1 bg-gray-900/70'
                    )}
                    style={{ transform: 'translateY(50%) rotate(45deg)' }}
                />
            </div>
        </div>
    )
}
