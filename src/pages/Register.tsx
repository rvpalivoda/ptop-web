import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Copy, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context';
import { useTranslation } from 'react-i18next';

const inputBase =
    'w-full px-3.5 py-2.5 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';
const btnPrimary =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow transition disabled:opacity-60';
const btnGhost =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            toast(t('register.toastShortPassword'));
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast(t('register.toastPasswordsMismatch'));
            return;
        }

        try {
            setLoading(true);
            const { mnemonic } = await register(formData.username, formData.password, formData.confirmPassword);
            setMnemonic(Array.isArray(mnemonic) ? mnemonic.map((w: any) => (typeof w === 'string' ? w : w.word)).join(' ') : mnemonic);
            toast(t('register.toastSuccess'));
        } catch (err: any) {
            console.error('Registration error:', err);
            toast(err instanceof Error ? t('register.toastErrorPrefix', { message: err.message }) : t('register.toastErrorGeneric'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur">
                    {/* Top bar */}
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <Link to="/" className={`${btnGhost} !px-2 !py-1 text-white/70`}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">{t('register.back')}</span>
                        </Link>
                        <Link
                            to="/"
                            className="select-none text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(147,197,253,0.45)]"
                            aria-label="Peerex P2P"
                        >
                            Peerex P2P
                        </Link>
                    </div>

                    <div className="px-6 py-6">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('register.title')}</h1>
                            <p className="mt-1 text-sm text-white/60">{t('register.subtitle')}</p>
                        </div>

                        {!mnemonic ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-xs text-white/60">{t('register.username')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className={inputBase}
                                        placeholder={t('register.username') as string}
                                        autoComplete="username"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs text-white/60">{t('register.password')}</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={`pr-10 ${inputBase}`}
                                            placeholder={t('register.passwordPlaceholder') as string}
                                            autoComplete="new-password"
                                        />
                                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs text-white/60">{t('register.confirmPassword')}</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className={`pr-10 ${inputBase}`}
                                            placeholder={t('register.confirmPasswordPlaceholder') as string}
                                            autoComplete="new-password"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className={btnPrimary} disabled={loading} aria-busy={loading}>
                                    {loading ? t('common.loading', { defaultValue: 'Loading…' }) : t('register.submit')}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                                    <p className="mb-2 text-sm text-white/70">{t('register.seedTitle')}</p>
                                    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {mnemonic.split(' ').map((word, idx) => (
                                            <div key={idx} className="rounded-xl bg-white/5 px-3 py-1 text-sm ring-1 ring-white/10">
                                                {idx + 1}. {word}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        <button type="button" onClick={() => navigator.clipboard.writeText(mnemonic)} className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200">
                                            <Copy className="h-4 w-4" /> {t('register.copy')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const blob = new Blob([JSON.stringify(mnemonic.split(' '))], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url; link.download = 'words.json'; link.click(); URL.revokeObjectURL(url);
                                            }}
                                            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"
                                        >
                                            <Download className="h-4 w-4" /> {t('register.download')}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <Link to="/login" className="text-blue-300 hover:text-blue-200 font-medium">
                                        {t('register.toLogin')}
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex items-center justify-between text-sm">
                            <Link to="/login" className="text-blue-300 hover:text-blue-200 font-medium">
                                {t('register.login')}
                            </Link>
                            <Link to="/recover" className="text-blue-300 hover:text-blue-200 font-medium">
                                {t('register.forgot')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
