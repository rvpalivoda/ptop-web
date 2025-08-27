import { useEffect, useRef, useState, useCallback } from 'react'
import { createOrderMessage, markOrderMessageRead, getOrderMessages } from '@/api/orders'

export type ChatMessage = {
    id: string
    orderId: string
    senderId: string // buyerID | sellerID
    senderName?: string
    body: string
    createdAt: string // ISO
    fileURL?: string
    fileType?: string
    fileSize?: number
    readAt?: string
}

type WsCompat = typeof WebSocket & {
    new (
        url: string,
        protocols?: string | string[],
        options?: { headers?: Record<string, string> } // для node-окружений, в браузере игнорится
    ): WebSocket
}

export function useOrderChat(
    orderId: string,
    token: string | undefined,
    {
        onConnected,
        onDisconnected,
        onError,
        onHistory,
    }: {
        onConnected?: () => void;
        onDisconnected?: () => void;
        onError?: (err: Event) => void;
        /** сервер может прислать историю сообщений пачкой */
        onHistory?: (history: ChatMessage[]) => void;
    } = {}
) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // нормализуем сообщение сервера в ChatMessage
    const mapMessage = useCallback(
        (m: Record<string, unknown>): ChatMessage => {
            const client = m.client as Record<string, unknown> | undefined
            return {
                id: String(m.id),
                orderId: String(m.orderId ?? orderId),
                senderId: String(m.senderId ?? m.clientID ?? ''),
                senderName:
                    typeof m.senderName === 'string'
                        ? m.senderName
                        : typeof m.clientName === 'string'
                        ? m.clientName
                        : typeof client?.username === 'string'
                        ? (client.username as string)
                        : undefined,
                body:
                    typeof m.body === 'string'
                        ? m.body
                        : typeof m.content === 'string'
                        ? m.content
                        : '',
                createdAt: String(m.createdAt),
                fileURL: typeof m.fileURL === 'string' ? m.fileURL : undefined,
                fileType: typeof m.fileType === 'string' ? m.fileType : undefined,
                fileSize: typeof m.fileSize === 'number' ? m.fileSize : undefined,
                readAt: typeof m.readAt === 'string' ? m.readAt : undefined,
            }
        },
        [orderId]
    )

    const sendMessage = useCallback(async (body: string, file?: File) => {
        try {
            await createOrderMessage(orderId, body, file);
            return true;
        } catch {
            return false;
        }
    }, [orderId]);

    const markRead = useCallback(async (msgId: string) => {
        try {
            const updated = await markOrderMessageRead(orderId, msgId);
            setMessages((prev) =>
                prev.map((m) => (m.id === msgId ? { ...m, readAt: updated.readAt } : m))
            );
            return true;
        } catch {
            return false;
        }
    }, [orderId]);

    useEffect(() => {
        if (!token || !orderId) return;

        let cancelled = false;
        setMessages([]);
        getOrderMessages(orderId)
            .then((history) => {
                if (cancelled) return
                const mapped = history.map((m) => mapMessage(m))
                setMessages(mapped)
                onHistory?.(mapped)
            })
            .catch(() => {})

        const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
            .replace(/^http/, 'ws')
            .replace(/\/$/, '');

        // передаем токен в query
        const url = `${base}/ws/orders/${orderId}/chat?token=${encodeURIComponent(token)}`;

        const WS = WebSocket as unknown as WsCompat;
        const ws = new WS(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            onConnected?.();
        };

        ws.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);

                // Случай: сервер прислал просто массив сообщений (история)
                if (Array.isArray(data)) {
                    const mapped = data.map((m: Record<string, unknown>) => mapMessage(m));
                    setMessages(mapped);
                    onHistory?.(mapped);
                    return;
                }

                // Случай: объект с полем messages (может быть история или батч)
                if (data && typeof data === 'object' && 'messages' in data && Array.isArray(data.messages)) {
                    const mapped = data.messages.map((m: Record<string, unknown>) => mapMessage(m));
                    if (data.type === 'CHAT_HISTORY') {
                        setMessages(mapped);
                        onHistory?.(mapped);
                    } else {
                        setMessages((prev) => [...prev, ...mapped]);
                    }
                    return;
                }

                // Случай: одиночное сообщение или объект с полем message
                if (data && typeof data === 'object') {
                    const raw = 'message' in data ? (data.message as Record<string, unknown>) : (data as Record<string, unknown>);
                    const mapped = mapMessage(raw);
                    setMessages((prev) => [...prev, mapped]);
                }
            } catch {
                // ignore
            }
        };

        ws.onerror = (e) => {
            onError?.(e);
        };

        ws.onclose = () => {
            setConnected(false);
            onDisconnected?.();
        };

        return () => {
            cancelled = true;
            ws.close();
            wsRef.current = null;
        };
    }, [orderId, token, onConnected, onDisconnected, onError, onHistory, mapMessage])

    return { messages, isConnected, sendMessage, markRead };
}
