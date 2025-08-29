import {Fragment, useEffect, useMemo, useRef, useState, useCallback} from 'react'
import {
    Send,
    Paperclip,
    Smile,
    Image as ImageIcon,
    FileText,
    File as FileIcon,
    X,
    Maximize2,
    ShieldCheck,
    Loader2,
    Download,
    Copy,
    AlertTriangle,
    Check,
    ChevronDown,
} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {ChatMessage, useOrderChat} from '@/hooks/useOrderChat'
import {MessageBubble} from './MessageBubble'
import {cn} from '@/lib/utils'

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

function KindIcon({kind}: { kind: 'image' | 'pdf' | 'file' }) {
    if (kind === 'image') return <ImageIcon className="h-4 w-4"/>
    if (kind === 'pdf') return <FileText className="h-4 w-4"/>
    return <FileIcon className="h-4 w-4"/>
}

// ===== main component =====
export function ChatPanel({
                              orderId,
                              token,
                              currentUserName,
                              fitParent = false,
                              embedded = false,
                              mobileOffset = 0,
                              buyerName,
                              sellerName,
                              buyerId,
                              sellerId,
                              orderPair,
                              disableSend = false,
                              orderHeaderLines,
                              orderStatus,
                              orderExpiresAt,
                              orderEscrow,
                          }: {
    orderId: string
    token?: string
    currentUserName: string
    /** Если true — панель растягивается по высоте родителя без ограничений viewport */
    fitParent?: boolean
    /** Встроенный режим — без собственного фона/рамки/скруглений */
    embedded?: boolean
    /** Смещение снизу (px) на мобильных — учёт фиксированных панелей/CTA */
    mobileOffset?: number
    /** Имена сторон (для надёжного определения автора) */
    buyerName?: string
    sellerName?: string
    /** ID сторон (точное сопоставление с clientID в сообщении) */
    buyerId?: string
    sellerId?: string
    /** Пара актива ордера, например BTC/USDT */
    orderPair?: string
    /** Запрет на отправку любых типов сообщений (закрытый ордер) */
    disableSend?: boolean
    /** Доп. строки для шапки в фуллскрине */
    orderHeaderLines?: string[]
    /** Текущий статус заказа */
    orderStatus?: string
    /** Дедлайн (expiresAt ISO) */
    orderExpiresAt?: string
    /** Признак эскроу */
    orderEscrow?: boolean
}) {
    const {t} = useTranslation()
    const listRef = useRef<HTMLDivElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const scrollerRef = useRef<HTMLButtonElement | null>(null)

    const initialScrolledRef = useRef(false)

    const smartScrollToBottom = useCallback(() => {
        const el = listRef.current
        if (!el) return
        // два кадра подряд для устойчивости после layout-shift
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight
            requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight
            })
        })
    }, [])

    const handleHistory = useCallback(() => {
        if (!initialScrolledRef.current) {
            setStickToBottom(true)
            smartScrollToBottom()
            initialScrolledRef.current = true
        }
    }, [smartScrollToBottom])

    const {messages, isConnected, sendMessage, markRead} = useOrderChat(orderId, token, {
        onHistory: handleHistory,
    })

    const [draft, setDraft] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [showEmoji, setShowEmoji] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [dndActive, setDndActive] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const STATUS_STYLES: Record<string, string> = {
        WAIT_PAYMENT: 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30',
        PAID: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
        DISPUTE: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
        CANCELED: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30',
        CANCELLED: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30',
        RELEASED: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
        EXPIRED: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
    }

    // refs moved above

    // ===== auto-resize textarea =====
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = Math.min(140, Math.max(42, ta.scrollHeight)) + 'px'
    }, [draft])

    // Fullscreen lifecycle: hide header/bottomnav and lock body scroll
    useEffect(() => {
        if (!isFullscreen) return
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        try {
            window.dispatchEvent(new CustomEvent('header-hide'))
        } catch {
        }
        try {
            window.dispatchEvent(new CustomEvent('bottomnav-hide'))
        } catch {
        }
        return () => {
            document.body.style.overflow = prevOverflow
            try {
                window.dispatchEvent(new CustomEvent('header-show'))
            } catch {
            }
            try {
                window.dispatchEvent(new CustomEvent('bottomnav-show'))
            } catch {
            }
        }
    }, [isFullscreen])

    // ===== autoscroll on new messages (if near bottom) =====
    const [stickToBottom, setStickToBottom] = useState(true)
    useEffect(() => {
        const el = listRef.current
        if (!el) return
        if (stickToBottom) {
            smartScrollToBottom()
        }
    }, [messages.length, stickToBottom])

    // на всякий случай, если история пришла до монтирования обработчика или изменялась высота контейнера
    useEffect(() => {
        if (!initialScrolledRef.current && messages.length > 0) {
            setStickToBottom(true)
            smartScrollToBottom()
            initialScrolledRef.current = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // держим низ при изменении размеров списка (пересчёт высоты контейнера/шрифтов и т.п.)
    useEffect(() => {
        const el = listRef.current
        if (!el || typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(() => {
            if (stickToBottom) smartScrollToBottom()
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [stickToBottom, smartScrollToBottom])

    // track manual scroll to toggle stickToBottom
    useEffect(() => {
        const el = listRef.current
        if (!el) return
        const handler = () => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
            setStickToBottom(nearBottom)
        }
        el.addEventListener('scroll', handler, {passive: true})
        return () => el.removeEventListener('scroll', handler)
    }, [])

    // mark messages as read when user is at bottom
    const readSet = useRef<Set<string>>(new Set())
    const readInFlight = useRef<Set<string>>(new Set())
    const userActiveRef = useRef(false)
    const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()
    const meNorm = norm(currentUserName)
    const buyerNorm = norm(buyerName)
    const sellerNorm = norm(sellerName)

    // Определяем clientID текущего пользователя по имени один раз
    const currentUserId = useMemo(() => {
        if (meNorm && buyerNorm && meNorm === buyerNorm) return buyerId
        if (meNorm && sellerNorm && meNorm === sellerNorm) return sellerId
        return undefined
    }, [meNorm, buyerNorm, sellerNorm, buyerId, sellerId])

    const isMine = (m: ChatMessage): boolean => {
        if (currentUserId && m.senderId) return m.senderId === currentUserId
        // Фолбэк по имени, если ID недоступны
        const sender = norm(m.senderName)
        if (sender && meNorm) return sender === meNorm
        return false
    }
    // явная отметка «прочитано»: только после явного взаимодействия пользователя и попадания сообщения в viewport
    const ioRef = useRef<IntersectionObserver | null>(null)
    const elToId = useRef<Map<Element, string>>(new Map())

    useEffect(() => {
        const root = listRef.current
        if (!root) return
        // явное взаимодействие: клик/скролл/тач в области чата
        const activate = () => {
            userActiveRef.current = true
        }
        root.addEventListener('pointerdown', activate, {passive: true})
        root.addEventListener('wheel', activate, {passive: true})
        root.addEventListener('touchstart', activate, {passive: true})

        // IO наблюдает появление сообщений в зоне видимости
        const obs = new IntersectionObserver((entries) => {
            if (!userActiveRef.current || document.visibilityState !== 'visible') return
            for (const entry of entries) {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.75) continue
                const id = elToId.current.get(entry.target)
                if (!id) continue
                const m = messages.find((mm) => mm.id === id)
                if (!m) continue
                if (isMine(m)) continue
                if (m.readAt) continue
                if (readSet.current.has(id)) continue
                if (readInFlight.current.has(id)) continue
                readInFlight.current.add(id)
                ;(async () => {
                    const ok = await markRead(id)
                    readInFlight.current.delete(id)
                    if (ok) readSet.current.add(id)
                })()
            }
        }, {root, threshold: [0.75]})
        ioRef.current = obs

        return () => {
            root.removeEventListener('pointerdown', activate)
            root.removeEventListener('wheel', activate)
            root.removeEventListener('touchstart', activate)
            obs.disconnect()
            ioRef.current = null
            elToId.current.clear()
        }
    }, [messages, markRead])

    const bindMsgRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        const obs = ioRef.current
        if (!obs) return
        // отписаться от старого
        for (const [node, storedId] of elToId.current.entries()) {
            if (storedId === id && (!el || node !== el)) {
                obs.unobserve(node)
                elToId.current.delete(node)
            }
        }
        if (el) {
            el.dataset.msgId = id
            elToId.current.set(el, id)
            obs.observe(el)
        }
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
                setError(t('orderChat.sendFailed'))
            }
        } catch (e) {
            setError(t('orderChat.sendFailed'))
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
            setError(t('orderChat.fileTooLarge', {mb: maxMB}))
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

    // быстрый набор emoji с акцентом на финансы/P2P
    const emojis = useMemo(
        () => [
            // базовые реакции
            '😀', '😂', '😉', '😍', '👍', '🙏', '👀', '🤔', '🎉', '🚀',
            // статусы/сигналы
            '✅', '❌', '⚠️', '🚫', '⏳', '⏰',
            // финансы
            '💵', '💶', '💷', '💴', '💳', '🏦', '💱', '🪙', '💹', '📈', '📉', '📊', '💼', '🧾',
            // p2p контекст
            '🤝', '🔐', '🛡️', '📄', '📎', '🔗', '📦', '🌐'
        ],
        []
    )

    return (
        <div
            className={cn(
                'flex flex-col h-full',
                embedded ? 'bg-transparent ring-0 rounded-none' : 'bg-gray-900/70 ring-1 ring-white/10 rounded-xl sm:rounded-2xl',
                fitParent ? 'max-h-none' : 'max-h-[calc(100svh-var(--chat-mobile-offset,0px))] sm:max-h-none',
                fitParent ? 'min-h-0' : 'min-h-[45svh] sm:min-h-0',
                isFullscreen && 'fixed inset-0 z-[80] h-[100svh] max-h-none min-h-0 rounded-none ring-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950'
            )}
            
        >
            {/* header */}
            <div className={cn('flex items-start justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-b border-white/10', isFullscreen && 'pt-safe')}>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="text-sm font-medium truncate">
                            {isFullscreen && orderPair ? orderPair : t('orderChat.title')}
                        </div>
                        {isFullscreen && (
                            <span className="text-[11px] text-white/60 truncate">#{orderId.slice(0, 6)}…{orderId.slice(-4)}</span>
                        )}
                    </div>
                    {isFullscreen && (
                        <>
                            {orderHeaderLines && orderHeaderLines.length > 0 && (
                                <div className="mt-0.5 text-[11px] leading-4 text-white/70">
                                    {orderHeaderLines.map((line, i) => (
                                        <div key={i} className="truncate">{line}</div>
                                    ))}
                                </div>
                            )}
                            {(orderStatus || orderEscrow || orderExpiresAt) && (
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {!!orderStatus && (
                                        <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium capitalize', STATUS_STYLES[orderStatus] ?? 'bg-white/10 text-white ring-1 ring-white/10')}>
                                            {t(`orderStatus.${orderStatus}`, orderStatus)}
                                        </span>
                                    )}
                                    {orderEscrow && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-medium bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {t('orderCard.escrow')}
                                        </span>
                                    )}
                                    {!!orderExpiresAt && (
                                        <span className="text-[11px] text-white/60">{new Date(orderExpiresAt).toLocaleString()}</span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div
                        className={cn('text-xs hidden sm:flex items-center gap-2', isConnected ? 'text-emerald-300' : 'text-white/60')}>
                        <span
                            className={cn('inline-block h-2 w-2 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse')}/>
                        {isConnected ? t('orderChat.online') : t('orderChat.offline')}
                    </div>
                    {/* expand on mobile */}
                    {!isFullscreen && (
                        <button
                            type="button"
                            className="sm:hidden inline-flex items-center justify-center  ring-white/10 hover:bg-white/10"
                            onClick={() => setIsFullscreen(true)}
                            aria-label="Open fullscreen chat"
                        >
                            <Maximize2 className="h-4 w-4"/>
                        </button>
                    )}
                    {isFullscreen && (
                        <button
                            type="button"
                            className="inline-flex items-center justify-center  ring-white/10 hover:bg-white/10"
                            onClick={() => setIsFullscreen(false)}
                            aria-label={t('common.close') as string}
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                </div>
            </div>

            {/* chat surface: messages + composer, монолит без внутренних полей в embedded-режиме */}
            <div className={cn(
                'flex flex-1 min-h-0 flex-col',
                embedded ? 'rounded-none bg-transparent' : 'rounded-xl bg-white/5'
            )}>
                {/* messages list */}
                <div
                    ref={listRef}
                    className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain p-0 space-y-2 chat-scrollbar"
                    {...onDropZone}
                >
                    {messages.map((m: ChatMessage, idx: number) => {
                        const prev = messages[idx - 1]
                        const prevDay = prev ? new Date(prev.createdAt).toDateString() : null
                        const thisDay = new Date(m.createdAt).toDateString()
                        const showDateHeader = prevDay !== thisDay
                        const computedSenderName = m.senderId === buyerId
                            ? buyerName
                            : m.senderId === sellerId
                                ? sellerName
                                : m.senderName
                        const reactKey = `${m.id ?? 'noid'}_${idx}`
                        return (
                            <Fragment key={reactKey}>
                                {showDateHeader && <DateDivider when={m.createdAt}/>}
                                <MessageBubble
                                    body={m.body}
                                    senderName={computedSenderName}
                                    isMe={isMine(m)}
                                    createdAt={m.createdAt}
                                    fileURL={m.fileURL}
                                    fileType={m.fileType}
                                    readAt={m.readAt}
                                    containerRef={m.id ? bindMsgRef(m.id) : undefined}
                                    // allow images to open in a lightbox
                                    onImageClick={(src: string) => setLightboxSrc(src)}
                                />
                            </Fragment>
                        )
                    })}

                    {/* drag & drop overlay */}
                    {dndActive && (
                        <div
                            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl sm:rounded-2xl bg-black/50">
                            <div
                                className="pointer-events-none rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80">
                                {t('orderChat.dropToAttach')}
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
                            <ChevronDown className="h-4 w-4"/> {t('orderChat.newMessages')}
                        </button>
                    )}
                </div>

                {/* composer */}
                {!disableSend && (
                    <div
                        className={cn(
                            'px-2 sm:px-3 py-2 border-t border-white/10 mb-1 pb-safe',
                            isFullscreen && 'pb-3'
                        )}
                        style={
                            isFullscreen
                                ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5px)' }
                                : undefined
                        }
                    >
                        {!!error && (
                            <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/20">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => setError(null)}
                                    className="ml-auto rounded p-1 hover:bg-white/10"
                                    aria-label={t('common.dismiss') as string}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        <div
                            className={cn(
                                // на очень узких — разрешаем wrap, чтобы send не уезжал за край
                                'flex items-center gap-2 sm:gap-3 supports-[width<360px]:flex-wrap'
                            )}
                        >
                            <div
                                className={cn(
                                    'flex items-center gap-1.5 sm:gap-2 flex-1 rounded-full ring-1 ring-white/10 bg-white/5 px-1.5 sm:px-2 py-1.5',
                                    'min-w-0' // критично для сжатия textarea
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        'inline-flex items-center justify-center rounded-full ring-1 ring-transparent hover:bg-white/10 transition',
                                        // компактные размеры на мобильных
                                        'w-10 h-10 p-2 sm:w-11 sm:h-11 sm:p-2.5'
                                    )}
                                    title={t('orderChat.attach') as string}
                                    disabled={isSending}
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>

                                {!file && (
                                    <>
            <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                rows={1}
                placeholder={t('orderChat.placeholder') as string}
                className={cn(
                    'flex-1 min-w-0 resize-none outline-none bg-transparent',
                    'px-1.5 sm:px-2 py-2',
                    'text-[15px] sm:text-sm',
                    'max-h-[140px] placeholder:text-white/40 disabled:opacity-70'
                )}
                disabled={isSending}
            />

                                        <div className="relative flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowEmoji((v) => !v)}
                                                className={cn(
                                                    'inline-flex items-center justify-center rounded-full ring-1 ring-transparent hover:bg-white/10 transition',
                                                    'w-10 h-10 p-2 sm:w-11 sm:h-11 sm:p-2.5'
                                                )}
                                                title={t('orderChat.emoji') as string}
                                                disabled={isSending}
                                                aria-expanded={showEmoji}
                                                aria-haspopup
                                            >
                                                <Smile className="w-4 h-4" />
                                            </button>

                                            {showEmoji && (
                                                <div
                                                    className={cn(
                                                        'absolute bottom-12 right-0 z-10 bg-gray-800 rounded-xl p-2 ring-1 ring-white/10 shadow-xl chat-scrollbar',
                                                        'w-52 sm:w-72 max-h-56 overflow-y-auto'
                                                    )}
                                                    role="menu"
                                                >
                                                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
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
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {file && <div className="flex-1" />}
                                <button
                                    type="button"
                                    onClick={onSend}
                                    className={cn(
                                        'inline-flex items-center justify-center rounded-full bg-emerald-500/20 hover:bg-emerald-500/25 transition disabled:opacity-60',
                                        'w-10 h-10 p-2 sm:w-11 sm:h-11 sm:p-2.5 flex-shrink-0'
                                    )}
                                    title={t('orderChat.send') as string}
                                    disabled={isSending || (!draft.trim() && !file)}
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                className="hidden"
                                onChange={onFileChange}
                            />

                            {/* send перенесён внутрь капсулы */}
                        </div>
                    </div>
                )}


                {/* attachment preview moved below controls to avoid wrapping on mobile */}
                {file && (
                    <div className="mt-2">
                        <AttachmentPreview
                            file={file}
                            onRemove={() => {
                                setFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            onOpenImage={(src) => setLightboxSrc(src)}
                        />
                    </div>
                )}

                {/* tip removed */}
            </div>
            {/* end chat surface */}
            {/* 👇 lightbox теперь внутри внешнего контейнера */}
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    style={{
                        paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                    }}
                    onClick={() => setLightboxSrc(null)}
                >
                    <img src={lightboxSrc} alt="preview" className="max-h-full max-w-full rounded-xl shadow-2xl"/>
                    <button
                        type="button"
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 ring-1 ring-white/20 hover:bg-white/15"
                        onClick={() => setLightboxSrc(null)}
                        aria-label={t('common.close') as string}
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>
            )}
        </div>
    )
}


function DateDivider({when}: { when: string | Date }) {
    const {t} = useTranslation()
    const d = new Date(when)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

    let label: string
    if (isSameDay(d, today)) {
        label = t('date.today')
    } else if (isSameDay(d, yesterday)) {
        label = t('date.yesterday')
    } else {
        label = d.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})
    }

    return (
        <div className="sticky top-0 z-10 py-1">
            <div className="flex items-center justify-center">
                <span
                    className="inline-flex items-center rounded-full bg-gray-900/80 backdrop-blur px-3 py-1 text-[11px] text-white/85 ring-1 ring-white/15">
                    {label}
                </span>
            </div>
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
        <div
            className="flex items-center gap-2 rounded-xl ring-1 ring-white/10 bg-white/5 px-2 py-1.5 w-full sm:w-auto sm:max-w-[220px]">
            {kind === 'image' && objectUrl ? (
                <button type="button" onClick={() => onOpenImage(objectUrl)}
                        className="h-10 w-10 flex-none overflow-hidden rounded-lg ring-1 ring-white/10">
                    <img src={objectUrl} alt={file.name} className="h-full w-full object-cover"/>
                </button>
            ) : (
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <KindIcon kind={kind}/>
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
                <X className="h-4 w-4"/>
            </button>
        </div>
    )
}

// ===== optional: small API for MessageBubble to open images =====
// If your current MessageBubble doesn’t accept onImageClick, you can extend it like so:
// export type MessageBubbleProps = { onImageClick?: (src: string) => void; ...existing }
