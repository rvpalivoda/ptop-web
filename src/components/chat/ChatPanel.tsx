import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
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
    const [file, setFile] = useState<File | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // автоскролл вниз при новых сообщениях
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const onSend = async () => {
        const text = draft.trim();
        if (!text && !file) return;
        const ok = await sendMessage(text, file ?? undefined);
        if (ok) {
            setDraft('');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const addEmoji = (emoji: string) => {
        setDraft((prev) => prev + emoji);
        setShowEmoji(false);
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
                        fileURL={m.fileURL}
                        fileType={m.fileType}
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
                    {file && (
                        <div className="text-xs text-white/70 max-w-[120px] truncate">
                            {file.name}
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={onFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center rounded-xl px-2 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                            title={t('orderChat.attach', 'Attach file') as string}
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowEmoji((v) => !v)}
                                className="inline-flex items-center justify-center rounded-xl px-2 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                                title={t('orderChat.emoji', 'Emoji') as string}
                            >
                                <Smile className="w-4 h-4" />
                            </button>
                            {showEmoji && (
                                <div className="absolute bottom-12 right-0 bg-gray-800 rounded-xl p-2 ring-1 ring-white/10 flex gap-1 flex-wrap w-40">
                                    {['😀','😂','😍','👍','😢','🎉'].map((em) => (
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
                            className="inline-flex items-center justify-center rounded-xl px-3 h-[42px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                            title={t('orderChat.send', 'Send') as string}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
