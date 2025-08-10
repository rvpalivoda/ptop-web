import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const inputBase =
    'w-full px-3.5 py-2.5 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';
const btnPrimary =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow transition disabled:opacity-60';
const btnGhost =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', code: '' });
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await login(formData.username, formData.password, formData.code);
            toast(t('login.toastSuccess'));
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            toast(
                err instanceof Error
                    ? t('login.toastErrorPrefix', { message: err.message })
                    : t('login.toastErrorGeneric')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur">
                    {/* Top bar */}
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <Link to="/" className={`${btnGhost} !px-2 !py-1 text-white/70`}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">{t('login.back')}</span>
                        </Link>
                        <Link
                            to="/"
                            className="select-none text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(147,197,253,0.45)]"
                            aria-label="Peerex P2P"
                        >
                            Peerex P2P
                        </Link>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('login.title')}</h1>
                            <p className="mt-1 text-sm text-white/60">{t('login.subtitle')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs text-white/60">{t('login.username')}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className={inputBase}
                                    placeholder={t('login.usernamePlaceholder') as string}
                                    autoComplete="username"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs text-white/60">{t('login.password')}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`pr-10 ${inputBase}`}
                                        placeholder={t('login.passwordPlaceholder') as string}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="block text-xs text-white/60">2FA</label>
                                    <span className="text-[11px] text-white/40">{t('login.optional', { defaultValue: 'optional' })}</span>
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className={inputBase}
                                    placeholder="123456"
                                    autoComplete="one-time-code"
                                />
                            </div>

                            <button type="submit" className={btnPrimary} disabled={loading} aria-busy={loading}>
                                {loading ? t('common.loading', { defaultValue: 'Loading…' }) : t('login.submit')}
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-between text-sm">
                            <Link to="/register" className="text-blue-300 hover:text-blue-200 font-medium">
                                {t('login.register')}
                            </Link>
                            <Link to="/recover" className="text-blue-300 hover:text-blue-200 font-medium">
                                {t('login.forgot')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
