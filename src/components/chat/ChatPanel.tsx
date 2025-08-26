import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatMessage, useOrderChat } from '@/hooks/useOrderChat';
import { MessageBubble } from './MessageBubble';

export function ChatPanel({
                              orderId,
                              token,
                              currentUserName,
                          }: {
    orderId: string;
    token?: string;
    currentUserName: string;
}) {
    const { t } = useTranslation();
    const { messages, isConnected, sendMessage } = useOrderChat(orderId, token);
    const [draft, setDraft] = useState('');
    const listRef = useRef<HTMLDivElement | null>(null);

    // автоскролл вниз при новых сообщениях
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const onSend = () => {
        const text = draft.trim();
        if (!text) return;
        const ok = sendMessage(text);
        if (ok) setDraft('');
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="flex h-full flex-col rounded-2xl bg-gray-900/70 ring-1 ring-white/10">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <div className="text-sm font-medium">
                    {t('orderChat.title', 'Chat')}
                </div>
                <div
                    className={
                        isConnected
                            ? 'text-xs text-emerald-300'
                            : 'text-xs text-white/60'
                    }
                >
                    {isConnected
                        ? t('orderChat.online', 'Connected')
                        : t('orderChat.offline', 'Connecting...')}
                </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m: ChatMessage) => (
                    <MessageBubble
                        key={m.id}
                        body={m.body}
                        senderName={m.senderName}
                        isMe={m.senderName === currentUserName}
                        createdAt={m.createdAt}
                    />
                ))}
            </div>

            <div className="p-2 border-t border-white/10">
                <div className="flex items-end gap-2">
          <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={t('orderChat.placeholder', 'Write a message…') as string}
              className="flex-1 resize-y min-h-[42px] max-h-[140px] rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm outline-none focus:ring-white/20"
          />
                    <button
                        type="button"
                        onClick={onSend}
                        className="inline-flex items-center justify-center rounded-xl px-3 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                        title={t('orderChat.send', 'Send') as string}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
