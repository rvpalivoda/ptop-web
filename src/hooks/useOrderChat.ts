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
            // Строгая схема по swagger, но с толерантностью к разным кейсам (fileUrl/file_url и т.п.)
            const pickStr = (...keys: string[]) => {
                for (const k of keys) {
                    const v = m[k]
                    if (typeof v === 'string' && v.length > 0) return v
                }
                return undefined
            }
            const pickNum = (...keys: string[]) => {
                for (const k of keys) {
                    const v = m[k]
                    if (typeof v === 'number' && Number.isFinite(v)) return v
                }
                return undefined
            }

            return {
                id: String(m.id),
                orderId: String(orderId),
                senderId: String((m as any).clientID ?? (m as any).clientId ?? ''),
                senderName: pickStr('senderName', 'sender_name', 'clientName', 'client_name'),
                body: pickStr('content') ?? '',
                createdAt: String(pickStr('createdAt') ?? ''),
                fileURL: pickStr('fileURL', 'fileUrl', 'file_url'),
                fileType: pickStr('fileType', 'file_type', 'mime', 'mimeType'),
                fileSize: pickNum('fileSize', 'file_size', 'size'),
                readAt: pickStr('readAt', 'read_at'),
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

                // История, присланная WS, игнорируется — историю берём ТОЛЬКО через REST API
                if (Array.isArray(data)) return;

                // Случай: объект с полем messages (может быть история или батч)
                if (data && typeof data === 'object' && 'messages' in data && Array.isArray((data as any).messages)) {
                    const dtype = (data as any).type as string | undefined
                    if (dtype === 'READ') {
                        const mapped = (data as any).messages.map((m: Record<string, unknown>) => mapMessage(m));
                        setMessages((prev) => prev.map((m) => {
                            const upd = mapped.find((x) => x.id === m.id)
                            return upd ? { ...m, readAt: upd.readAt } : m
                        }))
                    } else if (dtype !== 'CHAT_HISTORY') {
                        const mapped = (data as any).messages.map((m: Record<string, unknown>) => mapMessage(m));
                        setMessages((prev) => [...prev, ...mapped]);
                    }
                    return;
                }

                // Случай: одиночное сообщение или объект с полем message
                if (data && typeof data === 'object') {
                    const type = (data as any).type as string | undefined
                    const raw = 'message' in data ? (data.message as Record<string, unknown>) : (data as Record<string, unknown>);
                    const mapped = mapMessage(raw);

                    // READ-событие: обновляем readAt существующего сообщения
                    if (type === 'READ' && mapped.id) {
                        setMessages((prev) => prev.map((m) => (m.id === mapped.id ? { ...m, readAt: mapped.readAt } : m)))
                        return
                    }

                    // Новые сообщения: TEXT/FILE/SYSTEM — добавляем в ленту
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
