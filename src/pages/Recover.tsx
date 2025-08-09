import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Key, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context";
import { toast } from "@/components/ui/sonner";
import { recoverChallenge } from "@/api/auth";
import { useTranslation } from 'react-i18next';

const Recover = () => {
    const [username, setUsername] = useState("");
    const [words, setWords] = useState(["", "", ""]);
    const [indices, setIndices] = useState<number[]>([]);
    const [challengeLoaded, setChallengeLoaded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { recover } = useAuth();
    const { t } = useTranslation();

    const handleUsernameBlur = async () => {
        if (!username) return;
        try {
            const res = await recoverChallenge(username);
            setIndices(res.positions);
            setWords(["", "", ""]);
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
            const phrases = indices.map((pos, idx) => ({
                position: pos,
                word: words[idx],
            }));
            await recover(username, phrases, newPassword, confirmPassword);
            setIsSubmitted(true);
            toast(t('recover.toastSuccess'));
        } catch (err) {
            console.error("Recover error:", err);
            toast(
                err instanceof Error
                    ? t('recover.toastErrorPrefix', { message: err.message })
                    : t('recover.toastErrorGeneric'),
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
                    <div className="mb-8">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            {t('recover.back')}
                        </Link>
                        {!isSubmitted ? (
                            <>
                                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                                    <Key className="w-6 h-6 text-blue-500"/>
                                </div>
                                <h1 className="text-2xl font-semibold mb-2">
                                    {t('recover.title')}
                                </h1>
                                <p className="text-gray-300">
                                    {t('recover.subtitle')}
                                </p>
                            </>
                        ) : (
                            <>
                                <div
                                    className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center mb-4">
                                    <Check className="w-6 h-6 text-white"/>
                                </div>
                                <h1 className="text-2xl font-semibold mb-2">
                                    {t('recover.successTitle')}
                                </h1>
                                <p className="text-gray-300">{t('recover.successSubtitle')}</p>
                            </>
                        )}
                    </div>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('recover.username')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={handleUsernameBlur}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="username"
                                />
                            </div>
                            {challengeLoaded && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                                                placeholder={indices[idx] ? indices[idx].toString() : ""}
                                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {words.every((w) => w) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t('recover.newPassword')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4"/>
                                                ) : (
                                                    <Eye className="w-4 h-4"/>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t('recover.confirmPassword')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                            >
                                                {showConfirm ? (
                                                    <EyeOff className="w-4 h-4"/>
                                                ) : (
                                                    <Eye className="w-4 h-4"/>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                {t('recover.submit')}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-700 border border-green-600 rounded-md">
                                <p className="text-sm text-white">
                                    {t('recover.welcome', { username })}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-10 flex justify-between text-sm text-gray-300">
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                            {t('recover.register')}
                        </Link>
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                            {t('recover.login')}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Recover;
