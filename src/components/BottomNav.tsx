import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, Megaphone, Bell, Home } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  const openNotifications = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('open-notifications'));
    } catch {}
  }, []);

  const isActive = (to: string) => pathname === to;

  const btnBase =
    'flex-1 inline-flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition rounded-md';

  useEffect(() => {
    const hide = () => setVisible(false);
    const show = () => setVisible(true);
    window.addEventListener('bottomnav-hide', hide as any);
    window.addEventListener('bottomnav-show', show as any);
    return () => {
      window.removeEventListener('bottomnav-hide', hide as any);
      window.removeEventListener('bottomnav-show', show as any);
    };
  }, []);

  if (!isAuthenticated || !visible) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-screen-md flex items-stretch">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`${btnBase} ${isActive('/') ? 'text-white bg-white/10 ring-1 ring-white/20' : 'text-white/80 hover:text-white'}`}
          aria-pressed={isActive('/')}
        >
          <Home className="h-5 w-5" />
          <span>{t('common.market', 'Market')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className={`${btnBase} ${isActive('/orders') ? 'text-white bg-white/10 ring-1 ring-white/20' : 'text-white/80 hover:text-white'}`}
          aria-pressed={isActive('/orders')}
        >
          <List className="h-5 w-5" />
          <span>{t('header.orders', 'Orders')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/adverts')}
          className={`${btnBase} ${isActive('/adverts') ? 'text-white bg-white/10 ring-1 ring-white/20' : 'text-white/80 hover:text-white'}`}
          aria-pressed={isActive('/adverts')}
        >
          <Megaphone className="h-5 w-5" />
          <span>{t('header.adverts')}</span>
        </button>
        <button
          type="button"
          onClick={openNotifications}
          className={`${btnBase} text-white/80 hover:text-white`}
        >
          <span className="relative inline-grid place-items-center">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] min-w-[16px] h-[16px] px-1">
                {unreadCount}
              </span>
            )}
          </span>
          <span>{t('header.messages', 'Messages')}</span>
        </button>
      </div>
    </nav>
  );
}
