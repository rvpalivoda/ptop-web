
import { useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { ProfileDrawer } from './ProfileDrawer';
import { useTranslation } from 'react-i18next';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              <Link to="/"> Peerex P2P</Link>
            </div>
          </div>

          {/* Desktop Navigation
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">P2P</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">{t('header.trade')}</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">{t('header.wallet')}</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">{t('header.history')}</a>
          </nav>
*/}
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            {isAuthenticated ? (
              <ProfileDrawer />
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  {t('header.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  {t('header.register')}
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-gray-300 hover:text-white py-2 transition-colors">P2P</a>
              <a href="#" className="text-gray-300 hover:text-white py-2 transition-colors">{t('header.trade')}</a>
              <a href="#" className="text-gray-300 hover:text-white py-2 transition-colors">{t('header.wallet')}</a>
              <a href="#" className="text-gray-300 hover:text-white py-2 transition-colors">{t('header.history')}</a>
              {isAuthenticated ? (
                <ProfileDrawer triggerClassName="text-gray-300 hover:text-white py-2 transition-colors text-left flex" />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white py-2 transition-colors"
                  >
                    {t('header.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-300 hover:text-white py-2 transition-colors"
                  >
                    {t('header.register')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
