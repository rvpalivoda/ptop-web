import { useEffect, useRef, useState, useCallback } from 'react';
import {
    createOrderMessage,
    markOrderMessageRead,
    getOrderMessages,
    type OrderMessage,
} from '@/api/orders';

export type ChatMessage = {
    id: string;
    orderId: string;
    senderId: string;      // buyerID | sellerID
    senderName?: string;
    body: string;
    createdAt: string;     // ISO
    fileURL?: string;
    fileType?: string;
    fileSize?: number;
    readAt?: string;
};

type WsCompat = typeof WebSocket & {
    new (
        url: string,
        protocols?: string | string[],
        options?: { headers?: Record<string, string> } // для node-окружений, в браузере игнорится
    ): WebSocket;
};

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
        let cancelled = false;
        getOrderMessages(orderId)
            .then((res: OrderMessage[]) => {
                if (cancelled) return;
                const mapped = res.map((m) => ({
                    id: m.id,
                    orderId,
                    senderId: (m as any).senderId ?? m.clientID,
                    senderName: (m as any).senderName,
                    body: (m as any).body ?? m.content ?? '',
                    createdAt: m.createdAt,
                    fileURL: m.fileURL,
                    fileType: m.fileType,
                    fileSize: m.fileSize,
                    readAt: m.readAt,
                }));
                setMessages(mapped);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [orderId]);

    useEffect(() => {
        if (!token || !orderId) return;

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
                switch (data.type) {
                    case 'CHAT_HISTORY':
                        if (Array.isArray(data.messages)) {
                            setMessages(data.messages);
                            onHistory?.(data.messages);
                        }
                        break;
                    case 'NEW_MESSAGE':
                        if (data.message) {
                            setMessages((prev) => [...prev, data.message]);
                        }
                        break;
                    case 'MESSAGE_BATCH':
                        if (Array.isArray(data.messages)) {
                            setMessages((prev) => [...prev, ...data.messages]);
                        }
                        break;
                    default:
                        // ignore
                        break;
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
            ws.close();
            wsRef.current = null;
        };
    }, [orderId, token, onConnected, onDisconnected, onError, onHistory]);

    return { messages, isConnected, sendMessage, markRead };
}
