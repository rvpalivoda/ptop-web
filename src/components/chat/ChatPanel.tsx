import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Send,
    Paperclip,
    Smile,
    Image as ImageIcon,
    FileText,
    File as FileIcon,
    X,
    Loader2,
    Download,
    Copy,
    AlertTriangle,
    Check,
    ChevronDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChatMessage, useOrderChat } from '@/hooks/useOrderChat'
import { MessageBubble } from './MessageBubble'
import { cn } from '@/lib/utils'

// ===== helpers =====
const IMAGE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]

function prettySize(bytes: number) {
    if (!Number.isFinite(bytes)) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let n = bytes
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024
        i++
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

function getFileKind(mime?: string | null, name?: string | null) {
    if (!mime && name?.endsWith('.pdf')) return 'pdf'
    if (!mime && name) return 'file'
    if (!mime) return 'file'
    if (mime === 'application/pdf') return 'pdf'
    if (IMAGE_MIMES.includes(mime)) return 'image'
    return 'file'
}

function KindIcon({ kind }: { kind: 'image' | 'pdf' | 'file' }) {
    if (kind === 'image') return <ImageIcon className="h-4 w-4" />
    if (kind === 'pdf') return <FileText className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
}

// ===== main component =====
export function ChatPanel({
                              orderId,
                              token,
                              currentUserName,
                          }: {
    orderId: string
    token?: string
    currentUserName: string
}) {
    const { t } = useTranslation()
    const { messages, isConnected, sendMessage } = useOrderChat(orderId, token)

    const [draft, setDraft] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [showEmoji, setShowEmoji] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [dndActive, setDndActive] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const listRef = useRef<HTMLDivElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const scrollerRef = useRef<HTMLButtonElement | null>(null)

    // ===== auto-resize textarea =====
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = Math.min(140, Math.max(42, ta.scrollHeight)) + 'px'
    }, [draft])

    // ===== autoscroll on new messages (if near bottom) =====
    const [stickToBottom, setStickToBottom] = useState(true)
    useEffect(() => {
        const el = listRef.current
        if (!el) return
        if (stickToBottom) {
            el.scrollTop = el.scrollHeight
        }
    }, [messages.length, stickToBottom])

    // track manual scroll to toggle stickToBottom
    useEffect(() => {
        const el = listRef.current
        if (!el) return
        const handler = () => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
            setStickToBottom(nearBottom)
        }
        el.addEventListener('scroll', handler, { passive: true })
        return () => el.removeEventListener('scroll', handler)
    }, [])

    const onSend = async () => {
        const text = draft.trim()
        if (!text && !file) return
        setIsSending(true)
        setError(null)
        try {
            const ok = await sendMessage(text, file ?? undefined)
            if (ok) {
                setDraft('')
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
                setStickToBottom(true)
                const el = listRef.current
                if (el) el.scrollTop = el.scrollHeight
            } else {
                setError(t('orderChat.sendFailed', 'Failed to send. Try again.'))
            }
        } catch (e) {
            setError(t('orderChat.sendFailed', 'Failed to send. Try again.'))
        } finally {
            setIsSending(false)
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        // basic client-side guardrails for P2P UX
        const maxMB = 15
        if (f.size > maxMB * 1024 * 1024) {
            setError(t('orderChat.fileTooLarge', { defaultValue: 'File is too large (max {{mb}} MB).', mb: maxMB }))
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        setFile(f)
        setError(null)
        setShowEmoji(false)
    }

    // support pasting images from clipboard
    const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const item = Array.from(e.clipboardData.items).find((i) => i.kind === 'file')
        if (item) {
            const f = item.getAsFile()
            if (f) setFile(f)
        }
    }

    // drag & drop
    const onDropZone = {
        onDragOver: (e: React.DragEvent) => {
            e.preventDefault()
            setDndActive(true)
        },
        onDragLeave: (e: React.DragEvent) => {
            e.preventDefault()
            setDndActive(false)
        },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault()
            setDndActive(false)
            const f = e.dataTransfer.files?.[0]
            if (f) setFile(f)
        },
    }

    const addEmoji = (emoji: string) => {
        setDraft((prev) => prev + emoji)
        setShowEmoji(false)
        textareaRef.current?.focus()
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault()
            onSend()
        }
    }

    const showScrollToBottom = !stickToBottom

    // quick, tiny emoji set — can be replaced with a full picker later
    const emojis = useMemo(() => ['😀','😂','😍','👍','😢','🎉','🤝','🚀','🤔','✅'], [])

    return (
        <div className="flex h-full flex-col rounded-2xl bg-gray-900/70 ring-1 ring-white/10">
            {/* header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <div className="text-sm font-medium">{t('orderChat.title', 'Chat')}</div>
                <div className={cn('text-xs flex items-center gap-2', isConnected ? 'text-emerald-300' : 'text-white/60')}>
                    <span className={cn('inline-block h-2 w-2 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse')} />
                    {isConnected ? t('orderChat.online', 'Connected') : t('orderChat.offline', 'Connecting...')}
                </div>
            </div>

            {/* messages list */}
            <div
                ref={listRef}
                className="relative flex-1 overflow-y-auto p-3 space-y-2"
                {...onDropZone}
            >
                {messages.map((m: ChatMessage) => (
                    <MessageBubble
                        key={m.id}
                        body={m.body}
                        senderName={m.senderName}
                        isMe={m.senderName === currentUserName}
                        createdAt={m.createdAt}
                        fileURL={m.fileURL}
                        fileType={m.fileType}
                        // allow images to open in a lightbox
                        onImageClick={(src: string) => setLightboxSrc(src)}
                    />
                ))}

                {/* drag & drop overlay */}
                {dndActive && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                        <div className="pointer-events-none rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80">
                            {t('orderChat.dropToAttach', 'Drop file to attach')}
                        </div>
                    </div>
                )}

                {showScrollToBottom && (
                    <button
                        ref={scrollerRef}
                        type="button"
                        onClick={() => {
                            const el = listRef.current
                            if (el) el.scrollTop = el.scrollHeight
                            setStickToBottom(true)
                        }}
                        className="absolute right-4 bottom-4 inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-xs ring-1 ring-white/15 hover:bg-white/15"
                    >
                        <ChevronDown className="h-4 w-4" /> {t('orderChat.newMessages', 'New messages')}
                    </button>
                )}
            </div>

            {/* composer */}
            <div className="p-2 border-t border-white/10">
                {!!error && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/20">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="ml-auto rounded p-1 hover:bg-white/10"
                            aria-label={t('common.dismiss', 'Dismiss') as string}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2">
          <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              rows={1}
              placeholder={t('orderChat.placeholder', 'Write a message…') as string}
              className="flex-1 resize-none min-h-[42px] max-h-[140px] rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm outline-none focus:ring-white/20 disabled:opacity-70"
              disabled={isSending}
          />

                    {/* attachment preview (single file) */}
                    {file && (
                        <AttachmentPreview
                            file={file}
                            onRemove={() => {
                                setFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            onOpenImage={(src) => setLightboxSrc(src)}
                        />
                    )}

                    <div className="flex items-center gap-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                            className="hidden"
                            onChange={onFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center rounded-xl px-2 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                            title={t('orderChat.attach', 'Attach file') as string}
                            disabled={isSending}
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowEmoji((v) => !v)}
                                className="inline-flex items-center justify-center rounded-xl px-2 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                                title={t('orderChat.emoji', 'Emoji') as string}
                                disabled={isSending}
                                aria-expanded={showEmoji}
                                aria-haspopup
                            >
                                <Smile className="w-4 h-4" />
                            </button>
                            {showEmoji && (
                                <div
                                    className="absolute bottom-12 right-0 z-10 bg-gray-800 rounded-xl p-2 ring-1 ring-white/10 flex gap-1 flex-wrap w-48 shadow-xl"
                                    role="menu"
                                >
                                    {emojis.map((em) => (
                                        <button
                                            key={em}
                                            type="button"
                                            className="text-lg hover:scale-110 transition"
                                            onClick={() => addEmoji(em)}
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onSend}
                            className="inline-flex items-center justify-center rounded-xl px-3 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition disabled:opacity-60"
                            title={t('orderChat.send', 'Send') as string}
                            disabled={isSending || (!draft.trim() && !file)}
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* tiny antifraud hint for P2P context */}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                    <Check className="h-3.5 w-3.5" /> {t('orderChat.tipEscrow', 'Tip: keep communication in chat until escrow is released. Do not accept off-platform links.')}
                </div>
            </div>

            {/* lightbox */}
            {lightboxSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxSrc(null)}>
                    <img src={lightboxSrc} alt="preview" className="max-h-full max-w-full rounded-xl shadow-2xl" />
                    <button
                        type="button"
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 ring-1 ring-white/20 hover:bg-white/15"
                        onClick={() => setLightboxSrc(null)}
                        aria-label={t('common.close', 'Close') as string}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    )
}

// ===== attachment preview subcomponent =====
function AttachmentPreview({
                               file,
                               onRemove,
                               onOpenImage,
                           }: {
    file: File
    onRemove: () => void
    onOpenImage: (src: string) => void
}) {
    const kind = getFileKind(file.type, file.name)
    const [objectUrl, setObjectUrl] = useState<string | null>(null)

    useEffect(() => {
        if (kind === 'image') {
            const url = URL.createObjectURL(file)
            setObjectUrl(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [file, kind])

    return (
        <div className="flex items-center gap-2 rounded-xl ring-1 ring-white/10 bg-white/5 px-2 py-1.5 max-w-[220px]">
            {kind === 'image' && objectUrl ? (
                <button type="button" onClick={() => onOpenImage(objectUrl)} className="h-10 w-10 flex-none overflow-hidden rounded-lg ring-1 ring-white/10">
                    <img src={objectUrl} alt={file.name} className="h-full w-full object-cover" />
                </button>
            ) : (
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <KindIcon kind={kind} />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-white/80" title={file.name}>{file.name}</div>
                <div className="text-[11px] text-white/50">{prettySize(file.size)}</div>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="rounded-lg p-1 hover:bg-white/10"
                aria-label="Remove attachment"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

// ===== optional: small API for MessageBubble to open images =====
// If your current MessageBubble doesn’t accept onImageClick, you can extend it like so:
// export type MessageBubbleProps = { onImageClick?: (src: string) => void; ...existing }