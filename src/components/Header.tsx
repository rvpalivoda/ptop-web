import {useState} from 'react';
import {Bell, Menu, X} from 'lucide-react';
import {Link, NavLink} from 'react-router-dom';
import {useAuth} from '@/context';
import {ProfileDrawer} from './ProfileDrawer';
import {useTranslation} from 'react-i18next';

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const {isAuthenticated, logout} = useAuth();
    const {t} = useTranslation();

    const NavItem = ({to, label, onClick}: { to: string; label: string; onClick?: () => void }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({isActive}) =>
                [
                    // pill как у фильтров/формы
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
        <header className="fixed inset-x-0 top-0 z-50">
            {/* стекло/градиент — ближе к стилю offers */}
            <div
                className="border-b border-white/10 bg-gradient-to-b from-gray-950/80 to-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-900/40">
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
                            <span
                                className="hidden sm:inline-block rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/70 ring-1 ring-white/10">
                beta
              </span>
                        </div>

                        {/* Desktop navigation — пилюли как в фильтрах (только для авторизованных) */}
                        {isAuthenticated && (
                            <nav className="hidden md:flex items-center gap-2">
                                <NavItem to="/adverts" label={t('header.adverts')} />
                                <NavItem to="/my-deals" label={t('header.myDeals')} />
                                <NavItem to="/ad-deals" label={t('header.adDeals')} />
                                <NavItem to="/transactions" label={t('header.transactions')} />
                                <NavItem to="/balance" label={t('header.balance')}/>
                                <NavItem to="/escrow" label={t('header.escrow')}/>
                            </nav>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">


                            {isAuthenticated &&
                                <button
                                    className="group rounded-xl h-9 w-9 grid place-items-center bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                    aria-label="Notifications"
                                >
                <span className="relative inline-block">
                  <Bell size={18}/>
                  <span
                      className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400"/>
                </span>
                                </button>}

                            {isAuthenticated ? (
                                <ProfileDrawer
                                    triggerClassName="hidden md:inline-flex items-center gap-2 rounded-xl h-9 px-3 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
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

                            {/* Mobile menu button — тот же капсульный стиль */}
                            <button
                                onClick={() => setIsMenuOpen((v) => !v)}
                                className="md:hidden rounded-xl h-9 w-9 grid place-items-center bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                aria-label="Toggle menu"
                                aria-expanded={isMenuOpen}
                            >
                                {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu — те же пилюли, компактно */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-white/10">
                        <div className="container mx-auto px-4 py-3">
                            <nav className="flex flex-col gap-2">
                                {isAuthenticated && (
                                    <>
                                        <NavItem to="/adverts" label={t('header.adverts')}
                                                 onClick={() => setIsMenuOpen(false)} />
                                        <NavItem to="/my-deals" label={t('header.myDeals')}
                                                 onClick={() => setIsMenuOpen(false)} />
                                        <NavItem to="/ad-deals" label={t('header.adDeals')}
                                                 onClick={() => setIsMenuOpen(false)} />
                                        <NavItem to="/transactions" label={t('header.transactions')}
                                                 onClick={() => setIsMenuOpen(false)} />
                                        <NavItem to="/balance" label={t('header.balance')}
                                                 onClick={() => setIsMenuOpen(false)} />
                                        <NavItem to="/escrow" label={t('header.escrow')}
                                                 onClick={() => setIsMenuOpen(false)} />
                                    </>
                                )}

                                {isAuthenticated ? (
                                    <div className="mt-2 flex flex-col gap-2">
                                        <ProfileDrawer
                                            triggerClassName="inline-flex items-center gap-2 rounded-xl h-9 px-3 text-sm font-medium bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
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
                                            className="rounded-xl h-9 px-3  pt-2 text-sm font-semibold bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/20"
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
    );
};
