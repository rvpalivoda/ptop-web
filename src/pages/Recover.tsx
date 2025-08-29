import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Key, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context';
import { toast } from '@/components/ui/sonner';
import { recoverChallenge } from '@/api/auth';
import { useTranslation } from 'react-i18next';

const inputBase =
    'w-full px-3.5 py-2.5 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';
const btnPrimary =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow transition disabled:opacity-60';
const btnGhost =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white';

const Recover = () => {
    const [username, setUsername] = useState('');
    const [words, setWords] = useState(['', '', '']);
    const [indices, setIndices] = useState<number[]>([]);
    const [challengeLoaded, setChallengeLoaded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const { recover } = useAuth();
    const { t } = useTranslation();

    const handleUsernameBlur = async () => {
        if (!username) return;
        try {
            const res = await recoverChallenge(username);
            setIndices(res.positions);
            setWords(['', '', '']);
            setChallengeLoaded(true);
        } catch (err) {
            toast(t('recover.toastPositionsError'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast(t('recover.toastShortPassword'));
            return;
        }
        if (newPassword !== confirmPassword) {
            toast(t('recover.toastPasswordsMismatch'));
            return;
        }
        try {
            setLoading(true);
            const phrases = indices.map((pos, idx) => ({ position: pos, word: words[idx] }));
            await recover(username, phrases, newPassword, confirmPassword);
            setIsSubmitted(true);
            toast(t('recover.toastSuccess'));
        } catch (err: any) {
            console.error('Recover error:', err);
            toast(err instanceof Error ? t('recover.toastErrorPrefix', { message: err.message }) : t('recover.toastErrorGeneric'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex pt-16 justify-center px-4">
            <div className="w-full max-w-md">
                <div className="overflow-hidden rounded-2xl">
                    {/* Top bar */}
                    <div className="flex items-center justify-between  px-5 py-4">
                        <Link to="/login" className={`${btnGhost} !px-2 !py-1 text-white/70`}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">{t('recover.back')}</span>
                        </Link>
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                            {isSubmitted ? <Check className="h-4 w-4 text-emerald-400" /> : <Key className="h-4 w-4 text-blue-400" />}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6">
                        <div className="mb-6 text-center">
                            {!isSubmitted ? (
                                <>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('recover.title')}</h1>
                                    <p className="mt-1 text-sm text-white/60">{t('recover.subtitle')}</p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('recover.successTitle')}</h1>
                                    <p className="mt-1 text-sm text-white/60">{t('recover.successSubtitle')}</p>
                                </>
                            )}
                        </div>

                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Username */}
                                <div>
                                    <label className="mb-1.5 block text-xs text-white/60">{t('recover.username')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onBlur={handleUsernameBlur}
                                        className={inputBase}
                                        placeholder="username"
                                        autoComplete="username"
                                    />
                                </div>

                                {/* Challenge */}
                                {challengeLoaded && (
                                    <div>
                                        <label className="mb-1.5 block text-xs text-white/60">
                                            {t('recover.enterWords', { one: indices[0], two: indices[1], three: indices[2] })}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {words.map((w, idx) => (
                                                <input
                                                    key={idx}
                                                    type="text"
                                                    required
                                                    value={w}
                                                    onChange={(e) => {
                                                        const arr = [...words];
                                                        arr[idx] = e.target.value.trim();
                                                        setWords(arr);
                                                    }}
                                                    placeholder={indices[idx] ? indices[idx].toString() : ''}
                                                    className={inputBase}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Passwords */}
                                {words.every((w) => w) && (
                                    <>
                                        <div>
                                            <label className="mb-1.5 block text-xs text-white/60">{t('recover.newPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className={`pr-10 ${inputBase}`}
                                                    autoComplete="new-password"
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
                                            <label className="mb-1.5 block text-xs text-white/60">{t('recover.confirmPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirm ? 'text' : 'password'}
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`pr-10 ${inputBase}`}
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm((v) => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                                >
                                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button type="submit" className={btnPrimary} disabled={loading} aria-busy={loading}>
                                    {loading ? t('common.loading') : t('recover.submit')}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                                    <p className="text-sm text-emerald-200">{t('recover.welcome', { username })}</p>
                                </div>
                            </div>
                        )}

                        {/* Footer links */}
                        <div className="mt-8 flex items-center justify-between text-sm">
                            <Link to="/register" className="text-blue-300 hover:text-blue-200 font-medium">
                                {t('recover.register')}
                            </Link>
                            <Link to="/login" className="text-blue-300 hover:text-blue-200 font-medium">
                                {t('recover.login')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Recover;
