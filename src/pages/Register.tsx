import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Copy, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context';
import { useTranslation } from 'react-i18next';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
    });
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
            const {mnemonic} = await register(
                formData.username,
                formData.password,
                formData.confirmPassword,
            );
            setMnemonic(
                Array.isArray(mnemonic)
                    ? mnemonic
                        .map((w: any) => (typeof w === 'string' ? w : w.word))
                        .join(' ')
                    : mnemonic,
            );
            toast(t('register.toastSuccess'));
        } catch (err) {
            console.error('Registration error:', err);
            toast(
                err instanceof Error
                    ? t('register.toastErrorPrefix', { message: err.message })
                    : t('register.toastErrorGeneric'),
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
                    <div className="mb-8">
                        <Link
                            to="/"
                            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            {t('register.back')}
                        </Link>
        
                        <h1 className="text-2xl font-semibold mb-2">{t('register.title')}</h1>
                        <p className="text-gray-300">{t('register.subtitle')}</p>
                    </div>

                    {!mnemonic ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('register.username')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({...formData, username: e.target.value})
                                    }
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('register.username')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('register.password')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({...formData, password: e.target.value})
                                        }
                                        className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder={t('register.passwordPlaceholder')}
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
                                    {t('register.confirmPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({...formData, confirmPassword: e.target.value})
                                        }
                                        className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder={t('register.confirmPasswordPlaceholder')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4"/> :
                                            <Eye className="w-4 h-4"/>}
                                    </button>
                                </div>
                            </div>


                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                {t('register.submit')}
                            </button>
                            
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-700 border border-gray-600 rounded-md text-center">
                                <p className="mb-2 text-sm text-gray-300">{t('register.seedTitle')}</p>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {mnemonic.split(' ').map((word, idx) => (
                                        <div
                                            key={idx}
                                            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-md text-sm"
                                        >
                                            {idx + 1}. {word}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(mnemonic)}
                                        className="flex items-center text-blue-400 hover:text-blue-300"
                                    >
                                        <Copy className="w-4 h-4 mr-1"/> {t('register.copy')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const blob = new Blob([JSON.stringify(mnemonic.split(' '))], {type: 'application/json'});
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = 'words.json';
                                            link.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        className="flex items-center text-blue-400 hover:text-blue-300"
                                    >
                                        <Download className="w-4 h-4 mr-1"/> {t('register.download')}
                                    </button>
                                </div>
                            </div>
                            <div className="text-center">
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                                    {t('register.toLogin')}
                                </Link>
                            </div>
                        </div>
                    )}


                    <div className="mt-10 flex justify-between text-sm text-gray-300">
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                            {t('register.login')}
                        </Link>
                        <Link to="/recover" className="text-blue-400 hover:text-blue-300 font-medium">
                            {t('register.forgot')}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Register;
