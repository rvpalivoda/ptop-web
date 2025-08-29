import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context';
import { ProfileDrawer } from './ProfileDrawer';
import { useTranslation } from 'react-i18next';
import { NotificationsModal } from './notifications/NotificationsModal';
import { useNotifications } from '@/hooks/useNotifications';
/** =========================
 *  Header with notifications
 *  ========================= */
export const Header = () => {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const {isAuthenticated, logout} = useAuth();
    const {t} = useTranslation();
    const [hidden, setHidden] = useState(false);
    const lastY = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);

    useEffect(() => {
        const handler = () => setIsNotifOpen(true);
        window.addEventListener('open-notifications', handler as any);
        return () => window.removeEventListener('open-notifications', handler as any);
    }, []);
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            const prev = lastY.current;
            const delta = y - prev;
            if (Math.abs(delta) > 6) {
                setHidden(delta > 0 && y > 32);
                lastY.current = y;
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const {
        items,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loadMore,
        hasMore,
        loading,
    } = useNotifications();

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
            {/* no mobile overlay */}

            {/* Notifications modal */}
            <NotificationsModal
                open={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                items={items}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                loadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
            />

            <header className={`fixed inset-x-0 top-0 z-50 transition-transform duration-200 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="border-b border-white/10 bg-gradient-to-b from-gray-950/80 to-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40">
                    <div className="container mx-auto px-1">
                        <div className="flex h-14 md:h-16 items-center justify-between">
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
                                    <NavItem to="/orders" label={t('header.orders', 'Orders')} />
                                </nav>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                <div className="md:hidden flex items-center gap-2">{isAuthenticated ? (
                        <>
                            <ProfileDrawer
                                triggerClassName="inline-flex items-center gap-2 rounded-xl h-9 px-3 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                            />
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-xl h-9 px-3 pt-2 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                            >
                                {t('header.login')}
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl h-9 px-3 pt-2 text-sm font-semibold bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/20"
                            >
                                {t('header.register')}
                            </Link>
                        </>
                    )}</div>
                                {/* Language moved to Profile */}
                                {isAuthenticated && (
                                    <button
                                        onClick={() => setIsNotifOpen(true)}
                                        className="hidden md:grid group relative rounded-xl h-9 w-9 place-items-center bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                        aria-label={t('notifications.open')}
                                    >
                                        <Bell size={18}/>
                                        {/* Unread count badge (only if > 0) */}
                                        {unreadCount > 0 && (
                                            <span
                                                className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[11px] font-semibold bg-emerald-400 text-gray-900"
                                aria-label={t('notifications.unreadCount', { count: unreadCount })}
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
                                {/* no hamburger menu */}
                            </div>
                        </div>
                    </div>

                    {/* no mobile menu */}
                </div>
            </header>
        </>
    );
};
