import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { NotificationItem } from '@/hooks/useNotifications';

interface Props {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function NotificationsModal({
  open,
  onClose,
  items,
  markAsRead,
  markAllAsRead,
  loadMore,
  hasMore,
  loading,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleItemClick = (n: NotificationItem) => {
    markAsRead(n.id);
    if (n.linkTo) navigate(n.linkTo);
    onClose();
  };

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    if (hasMore && !loading && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      loadMore();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid="notifications-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[71] grid place-items-center p-4"
      >
        <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900/90 backdrop-blur ring-1 ring-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/70">
                {t('notifications.title', 'Уведомления')}
              </span>
              {items.some((i) => !i.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="rounded-lg px-2 py-1 text-xs bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition"
                >
                  {t('notifications.markAllRead', 'Отметить все прочитанными')}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/70 hover:bg-white/5 hover:text-white transition"
              aria-label={t('notifications.close', 'Закрыть')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2" onScroll={handleScroll}>
            {items.length === 0 ? (
              <div className="p-6 text-center text-white/60">
                {t('notifications.empty', 'Пока уведомлений нет')}
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className={[
                        'w-full text-left px-4 py-3 transition flex items-start gap-3',
                        'hover:bg-white/5',
                        !n.isRead ? 'bg-emerald-400/5' : '',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mt-1 inline-flex h-2 w-2 rounded-full',
                          n.isRead ? 'bg-white/20' : 'bg-emerald-400',
                        ].join(' ')}
                        aria-hidden
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{n.title}</p>
                          <time
                            className="shrink-0 text-[11px] text-white/50"
                            dateTime={n.createdAt}
                            title={new Date(n.createdAt).toLocaleString()}
                          >
                            {formatRelative(n.createdAt)}
                          </time>
                        </div>
                        {n.body && (
                          <p className="mt-1 text-sm text-white/70">{n.body}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {loading && (
              <div className="p-4 text-center text-white/60">
                {t('notifications.loading', 'Загрузка...')}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function formatRelative(iso: string) {
  const dt = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - dt);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}
