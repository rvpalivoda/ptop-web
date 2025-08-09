import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        code: ''
    });
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(formData.username, formData.password, formData.code);
            toast(t('login.toastSuccess'));
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            toast(
                err instanceof Error
                    ? t('login.toastErrorPrefix', { message: err.message })
                    : t('login.toastErrorGeneric'),
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
                    <div className="mb-8">
                        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            {t('login.back')}
                        </Link>
                        <h1 className="text-2xl font-semibold mb-2">{t('login.title')}</h1>
                        <p className="text-gray-300">{t('login.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('login.username')}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('login.usernamePlaceholder')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('login.password')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('login.passwordPlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                </button>
                            </div>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Код 2FA
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="123456"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2  rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            {t('login.submit')}
                        </button>
                    </form>

                    <div className="mt-10 flex justify-between text-sm text-gray-300">
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                            {t('login.register')}
                        </Link>
                        <Link to="/recover" className="text-blue-400 hover:text-blue-300 font-medium">
                            {t('login.forgot')}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
