import { cn } from '@/lib/utils'
import {
    FileText,
    File as FileIcon,
    Image as ImageIcon,
    Download,
    ExternalLink,
} from 'lucide-react'
import { useMemo } from 'react'

export type MessageBubbleProps = {
    body: string
    senderName?: string
    isMe: boolean
    createdAt: string | Date
    fileURL?: string
    fileType?: string
    /** Optional: when provided, images open in a lightbox */
    onImageClick?: (src: string) => void
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

function linkify(text: string) {
    // lightweight URL linker (keeps UX simple, no extra lib)
    const urlRegex = /(https?:\/\/[^\s]+)|((?:^|\s)www\.[^\s]+)/gi
    const parts: Array<string | JSX.Element> = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    const str = text
    const regex = new RegExp(urlRegex)
    while ((match = urlRegex.exec(str)) !== null) {
        if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index))
        const raw = match[0].trim()
        const href = raw.startsWith('http') ? raw : `https://${raw.trim()}`
        parts.push(
            <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className="underline break-all">
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
                                  onImageClick,
                              }: MessageBubbleProps) {
    const filename = useMemo(() => extractFilename(fileURL), [fileURL])
    const kind = useMemo(() => getFileKind(fileType, filename), [fileType, filename])
    const created = useMemo(() => new Date(createdAt), [createdAt])

    return (
        <div className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 ring-1 text-sm shadow-sm',
                    isMe
                        ? 'bg-emerald-500/15 ring-emerald-500/25 text-emerald-100'
                        : 'bg-white/5 ring-white/10 text-white/90'
                )}
            >
                {!isMe && senderName && (
                    <div className="text-[11px] mb-0.5 opacity-70">{senderName}</div>
                )}

                {/* message text with linkified URLs */}
                {body && <div className="whitespace-pre-wrap break-words">{linkify(body)}</div>}

                {/* attachment */}
                {fileURL && kind === 'image' && (
                    <button
                        type="button"
                        onClick={() => onImageClick?.(fileURL)}
                        className="mt-2 block overflow-hidden rounded-lg ring-1 ring-white/10 hover:opacity-95 focus:outline-none"
                        title={filename ?? 'image'}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fileURL}
                            alt={filename ?? 'attachment'}
                            className="max-h-80 w-full object-contain cursor-zoom-in"
                            loading="lazy"
                        />
                    </button>
                )}

                {fileURL && kind !== 'image' && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 p-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                            <KindIcon kind={kind} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs" title={filename ?? fileURL}>{filename ?? fileURL}</div>
                            <div className="text-[11px] text-white/60">{fileType ?? 'file'}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            <a
                                href={fileURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/10"
                                title="Open"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <a
                                href={fileURL}
                                download={filename}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/10"
                                title="Download"
                            >
                                <Download className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>
                )}

                <div className="mt-1 text-[10px] opacity-60" title={created.toLocaleString()}>
                    {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}
