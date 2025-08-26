import {useEffect, useMemo, useState, useCallback} from 'react';
import {Bell, Menu, X} from 'lucide-react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {useAuth} from '@/context';
import {ProfileDrawer} from './ProfileDrawer';
import {useTranslation} from 'react-i18next';

/** =========================
 *  Notifications: интерфейсы
 *  ========================= */
export interface NotificationItem {
    id: string;
    title: string;
    body: string;
    createdAt: string;     // ISO string
    isRead: boolean;
    linkTo?: string;       // путь, куда вести по клику
}

/** ============================================
 *  Хук-заглушка: заменишь на реальный API/WS
 *  ============================================ */
function useNotifications() {
    const [items, setItems] = useState<NotificationItem[]>([
        // TODO: удалить мок, подключить реальный фетч
        {
            id: 'n1',
            title: 'Новая сделка',
            body: 'Покупатель создал сделку по вашему объявлению.',
            createdAt: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 мин назад
            isRead: false,
            linkTo: '/ad-deals/123',
        },
        {
            id: 'n2',
            title: 'Платёж зачислен в эскроу',
            body: 'Проверка средств завершена. Можно продолжать.',
            createdAt: new Date(Date.now() - 60 * 60_000).toISOString(), // 1 час назад
            isRead: true,
            linkTo: '/escrow',
        },
    ]);

    const unreadCount = useMemo(() => items.filter(i => !i.isRead).length, [items]);

    const markAsRead = useCallback((id: string) => {
        setItems(prev => prev.map(i => (i.id === id ? {...i, isRead: true} : i)));
        // TODO: POST /notifications/:id/read
    }, []);

    const markAllAsRead = useCallback(() => {
        setItems(prev => prev.map(i => ({...i, isRead: true})));
        // TODO: POST /notifications/read-all
    }, []);

    // TODO: заменить на реальный fetch + WS подписку:
    // useEffect(() => { fetch('/api/notifications'); ...; subscribeWS(); }, []);

    return {items, unreadCount, markAsRead, markAllAsRead};
}

/** ============================================
 *  Компонент модального окна уведомлений
 *  ============================================ */
function NotificationsModal({
                                open,
                                onClose,
                                items,
                                markAsRead,
                                markAllAsRead,
                            }: {
    open: boolean;
    onClose: () => void;
    items: NotificationItem[];
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}) {
    const {t} = useTranslation();
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

    return (
        <>
            {/* backdrop */}
            <div
                className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                data-testid="notifications-backdrop"
            />
            {/* dialog */}
            <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-[71] grid place-items-center p-4"
            >
                <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900/90 backdrop-blur ring-1 ring-white/10 shadow-2xl">
                    {/* header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/70">
                {t('notifications.title', 'Уведомления')}
              </span>
                            {items.some(i => !i.isRead) && (
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
                            className="rounded-xl h-9 w-9 grid place-items-center bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                            aria-label={t('common.close', 'Закрыть')}
                        >
                            <X size={18}/>
                        </button>
                    </div>

                    {/* list */}
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {items.length === 0 ? (
                            <div className="p-6 text-center text-white/60">
                                {t('notifications.empty', 'Пока уведомлений нет')}
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/10">
                                {items.map(n => (
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
                                                    <p className="text-sm font-medium text-white">
                                                        {n.title}
                                                    </p>
                                                    <time
                                                        className="shrink-0 text-[11px] text-white/50"
                                                        dateTime={n.createdAt}
                                                        title={new Date(n.createdAt).toLocaleString()}
                                                    >
                                                        {formatRelative(n.createdAt)}
                                                    </time>
                                                </div>
                                                {n.body && (
                                                    <p className="mt-1 text-sm text-white/70">
                                                        {n.body}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/** Вспомогательный форматтер «X минут назад» */
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

/** =========================
 *  Твой Header с уведомлениями
 *  ========================= */
export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const {isAuthenticated, logout} = useAuth();
    const {t} = useTranslation();
    const {items, unreadCount, markAsRead, markAllAsRead} = useNotifications();

    const NavItem = ({to, label, onClick}: { to: string; label: string; onClick?: () => void }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({isActive}) =>
                [
                    'inline-flex items-center rounded-xl h-9 px-3 text-sm font-medium transition',
                    'bg-white/5 ring-1 ring-white/10 text-white/80 hover:bg-white/10 hover:text-white',
                    isActive ? 'bg-white/15 text-white shadow-sm' : '',
                ].join(' ')
            }
        >
            {label}
        </NavLink>
    );

    return (
        <>
            {isMenuOpen && (
                <div
                    data-testid="mobile-menu-overlay"
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-black/80 md:hidden"
                />
            )}

            {/* Modal уведомлений */}
            <NotificationsModal
                open={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                items={items}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
            />

            <header className="fixed inset-x-0 top-0 z-50">
                <div className="border-b border-white/10 bg-gradient-to-b from-gray-950/80 to-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40">
                    <div className="container mx-auto px-1">
                        <div className="flex h-16 items-center justify-between">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/"
                                    className="select-none text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(147,197,253,0.45)] hover:drop-shadow-[0_0_12px_rgba(147,197,253,0.75)] transition-all duration-300"
                                    aria-label="Peerex P2P"
                                >
                                    Peerex P2P
                                </Link>
                                <span className="hidden sm:inline-block rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/70 ring-1 ring-white/10">
                  beta
                </span>
                            </div>

                            {/* Desktop nav */}
                            {isAuthenticated && (
                                <nav className="hidden md:flex items-center gap-2">
                                    <NavItem to="/adverts" label={t('header.adverts')} />
                                    <NavItem to="/my-deals" label={t('header.myDeals')} />
                                    <NavItem to="/ad-deals" label={t('header.adDeals')} />
                                    <NavItem to="/transactions" label={t('header.transactions')} />
                                    <NavItem to="/balance" label={t('header.balance')} />
                                    <NavItem to="/escrow" label={t('header.escrow')} />
                                </nav>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {isAuthenticated && (
                                    <button
                                        onClick={() => setIsNotifOpen(true)}
                                        className="group relative rounded-xl h-9 w-9 grid place-items-center bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                        aria-label={t('notifications.open', 'Открыть уведомления')}
                                    >
                                        <Bell size={18}/>
                                        {/* Бейдж с количеством непрочитанных (только если > 0) */}
                                        {unreadCount > 0 && (
                                            <span
                                                className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[11px] font-semibold bg-emerald-400 text-gray-900"
                                                aria-label={t('notifications.unreadCount', {defaultValue: '{{count}} неп.', count: unreadCount})}
                                            >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                                        )}
                                    </button>
                                )}

                                {isAuthenticated ? (
                                    <ProfileDrawer
                                        triggerClassName="hidden md:inline-flex items-center gap-2 rounded-xl h-9 px-3 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white [&>svg]:hidden"
                                    />
                                ) : (
                                    <div className="hidden md:flex items-center gap-2">
                                        <NavLink
                                            to="/login"
                                            className={({isActive}) =>
                                                [
                                                    'rounded-xl h-9 px-3 pt-2 text-sm font-medium ring-1 ring-white/10 transition',
                                                    'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
                                                    isActive ? 'bg-white/15 text-white' : '',
                                                ].join(' ')
                                            }
                                        >
                                            {t('header.login')}
                                        </NavLink>
                                        <NavLink
                                            to="/register"
                                            className={({isActive}) =>
                                                [
                                                    'rounded-xl h-9 px-3 pt-2 text-sm font-semibold ring-1 ring-white/10 transition',
                                                    'bg-white/10 text-white hover:bg-white/20',
                                                    isActive ? 'bg-white/20 text-white' : '',
                                                ].join(' ')
                                            }
                                        >
                                            {t('header.register')}
                                        </NavLink>
                                    </div>
                                )}

                                {/* Mobile menu */}
                                <button
                                    onClick={() => setIsMenuOpen(v => !v)}
                                    className="md:hidden rounded-xl h-9 w-9 grid place-items-center bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                    aria-label="Toggle menu"
                                    aria-expanded={isMenuOpen}
                                >
                                    {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {isMenuOpen && (
                        <div className="md:hidden border-t border-white/10">
                            <div className="container mx-auto px-4 py-3">
                                <nav className="flex flex-col gap-2">
                                    {isAuthenticated && (
                                        <>
                                            <NavItem to="/adverts" label={t('header.adverts')} onClick={() => setIsMenuOpen(false)} />
                                            <NavItem to="/my-deals" label={t('header.myDeals')} onClick={() => setIsMenuOpen(false)} />
                                            <NavItem to="/ad-deals" label={t('header.adDeals')} onClick={() => setIsMenuOpen(false)} />
                                            <NavItem to="/transactions" label={t('header.transactions')} onClick={() => setIsMenuOpen(false)} />
                                            <NavItem to="/balance" label={t('header.balance')} onClick={() => setIsMenuOpen(false)} />
                                            <NavItem to="/escrow" label={t('header.escrow')} onClick={() => setIsMenuOpen(false)} />
                                        </>
                                    )}

                                    {isAuthenticated ? (
                                        <div className="mt-2 flex flex-col gap-2">
                                            <ProfileDrawer
                                                triggerClassName="inline-flex items-center gap-2 rounded-xl h-9 px-3 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white [&>svg]:hidden"
                                            />
                                            <button
                                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                                className="text-left rounded-xl h-9 px-3 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                            >
                                                {t('profile.logout')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 flex flex-col gap-2">
                                            <Link
                                                to="/login"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="rounded-xl h-9 px-3 pt-2 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                            >
                                                {t('header.login')}
                                            </Link>
                                            <Link
                                                to="/register"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="rounded-xl h-9 px-3 pt-2 text-sm font-semibold bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/20"
                                            >
                                                {t('header.register')}
                                            </Link>
                                        </div>
                                    )}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};
