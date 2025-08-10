import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { enable2fa, disable2fa, verifyPassword as apiVerifyPassword } from '@/api';
import { useAuth } from '@/context';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { clearTwoFactorEnabled, loadTwoFactorEnabled, saveTwoFactorEnabled } from '@/storage/two_factor';

interface Props { triggerClassName?: string }

const inputBase =
    'w-full px-3.5 py-2.5 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';

const btnGhost =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 transition';

const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow';

const btnDanger =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white px-4 py-2 text-sm font-medium shadow';

const card = 'rounded-2xl border border-white/10 bg-gray-900/60 p-4';

export const ProfileDrawer = ({ triggerClassName }: Props) => {
  const { userInfo, regenerateWords, changePassword, setPinCode, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [show2faDialog, setShow2faDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(userInfo?.twofaEnabled ?? loadTwoFactorEnabled());
  const [newSeed, setNewSeed] = useState<string | null>(null);
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinPassword, setPinPassword] = useState('');
  const [pinCodeValue, setPinCodeValue] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [copiedUser, setCopiedUser] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pinDigits];
    next[index] = val;
    setPinDigits(next);
    const value = next.join('');
    setPinCodeValue(value);
    if (val && index < pinInputRefs.current.length - 1) pinInputRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) pinInputRefs.current[index - 1]?.focus();
  };

  useEffect(() => { twoFactorEnabled ? saveTwoFactorEnabled(true) : clearTwoFactorEnabled(); }, [twoFactorEnabled]);
  useEffect(() => { if (userInfo) setTwoFactorEnabled(userInfo.twofaEnabled); }, [userInfo]);
  useEffect(() => { if (!show2faDialog) { setTwoFactorSecret(null); setOtpAuthUrl(null); setPasswordCheck(''); } }, [show2faDialog]);
  useEffect(() => { refresh().catch(console.error); }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }
    try {
      setBusy(true);
      await changePassword(formData.currentPassword, formData.newPassword);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(t('profile.passwordChangeError'));
    } finally {
      setBusy(false);
    }
  };

  const verifyPasswordWith = async (pwd: string) => {
    try { await apiVerifyPassword(pwd); return true; } catch { setError(t('profile.invalidPassword')); return false; }
  };

  const startTwoFactor = async () => {
    try {
      setBusy(true);
      const res = await enable2fa(passwordCheck);
      setTwoFactorSecret(res.secret);
      setOtpAuthUrl(res.url);
      setTwoFactorEnabled(true);
    } catch (err) {
      setError('2FA: ' + (err as any)?.message ?? 'failed');
    } finally { setBusy(false); }
  };

  const stopTwoFactor = async () => {
    try { setBusy(true); await disable2fa(passwordCheck); setTwoFactorEnabled(false); }
    catch (err) { setError('2FA: ' + (err as any)?.message ?? 'failed'); }
    finally { setBusy(false); }
  };

  const handleRegenerate = async () => {
    try {
      setBusy(true);
      const res = await regenerateWords(regeneratePassword);
      const phrase = res.mnemonic.sort((a: any, b: any) => a.position - b.position).map((w: any) => w.word).join(' ');
      setNewSeed(phrase);
      setRegeneratePassword('');
    } catch (err) { setError((err as any)?.message ?? 'Failed to regenerate'); } finally { setBusy(false); }
  };

  const handleRegenerateWithVerify = async () => { if (await verifyPasswordWith(regeneratePassword)) await handleRegenerate(); };

  const handleSetPin = async () => {
    if (!(await verifyPasswordWith(pinPassword))) return;
    try {
      setBusy(true);
      await setPinCode(pinPassword, pinCodeValue);
      setPinPassword(''); setPinCodeValue(''); setPinDigits(['', '', '', '']); setShowPinDialog(false);
    } catch { setError(t('profile.pinCodeError')); } finally { setBusy(false); }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const ModalContent = ({ children, title }: { children: React.ReactNode; title: string }) => (
      <DialogContent className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white sm:max-w-lg w-[calc(100vw-2rem)] rounded-2xl border border-white/10 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5">{children}</div>
        {error && (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
            </div>
        )}
      </DialogContent>
  );

  return (
      <Sheet>
        <SheetTrigger asChild>
          <button className={triggerClassName || btnGhost}>
            <User className="h-4 w-4" />
            <span>{t('profile.title')}</span>
          </button>
        </SheetTrigger>
        <SheetContent
            side="right"
            className="text-white h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-l border-white/10 p-0"
        >
          <SheetClose className="absolute right-4 top-4 rounded-full bg-white/5 p-1 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white" />

          {/* Header */}
          <div className="px-5 pt-6 pb-4 border-b border-white/10 backdrop-blur">
            <SheetHeader className="items-start">
              <SheetTitle className="text-2xl font-bold tracking-tight">{t('profile.title')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(userInfo?.username || '');
                        setCopiedUser(true);
                        setTimeout(() => setCopiedUser(false), 1200);
                      }}
                      className="group flex items-center gap-2 text-left text-base font-semibold text-white/90 hover:text-white"
                  >
                    {userInfo?.username || ''}
                    {copiedUser ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60 group-hover:text-white/80" />}
                  </button>
                  <div className="mt-0.5 text-xs text-white/60">
                    {twoFactorEnabled ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-500/30">2FA {t('common.enabled', { defaultValue: 'enabled' })}</span>
                    ) : (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/70 ring-1 ring-white/10">2FA {t('common.disabled', { defaultValue: 'disabled' })}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex h-[calc(100%-152px)] flex-col overflow-y-auto px-5 py-5 gap-4">
            {/* Security actions  <div className={card}> */}
            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">{t('profile.security', { defaultValue: 'Security' })}</div>
              <div className="grid gap-2  ">
                <Dialog open={showPwdDialog} onOpenChange={setShowPwdDialog}>
                  <DialogTrigger asChild>
                    <button className={btnGhost}><Key className="h-4 w-4" />{t('profile.changePassword')}</button>
                  </DialogTrigger>
                  <ModalContent title={t('profile.changePassword') as string}>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs text-white/60">{t('profile.currentPassword')}</label>
                        <div className="relative">
                          <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              className={`pr-10 ${inputBase}`}
                          />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-white/60">{t('profile.newPassword')}</label>
                        <div className="relative">
                          <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                              className={`pr-10 ${inputBase}`}
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-white/60">{t('profile.confirmNewPassword')}</label>
                        <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={inputBase} />
                      </div>
                      <button type="submit" className={`${btnPrimary} w-full`} disabled={busy}>{t('profile.updatePassword')}</button>
                    </form>
                  </ModalContent>
                </Dialog>

                <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                  <DialogTrigger asChild>
                    <button className={btnGhost}><KeyRound className="h-4 w-4" />{t('profile.pinCode')}</button>
                  </DialogTrigger>
                  <ModalContent title={t('profile.pinCodeSetup') as string}>
                    <div className="space-y-4">
                      <input type="password" value={pinPassword} onChange={(e) => setPinPassword(e.target.value)} placeholder={t('profile.enterPassword') as string} className={inputBase} />
                      <div className="flex gap-2">
                        {pinDigits.map((d, idx) => (
                            <input
                                key={idx}
                                type="text"
                                ref={(el) => (pinInputRefs.current[idx] = el)}
                                value={pinDigits[idx]}
                                maxLength={1}
                                onChange={(e) => handleDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                                className={`w-12 text-center text-2xl font-bold tracking-widest ${inputBase}`}
                            />
                        ))}
                      </div>
                      <button type="button" onClick={handleSetPin} className={`${btnPrimary} w-full`} disabled={busy}>{t('profile.save')}</button>
                    </div>
                  </ModalContent>
                </Dialog>

                <Dialog open={show2faDialog} onOpenChange={setShow2faDialog}>
                  <DialogTrigger asChild>
                    <button className={btnGhost}><ShieldCheck className="h-4 w-4" />{t('profile.twoFactorAuth')}</button>
                  </DialogTrigger>
                  <ModalContent title={t('profile.twoFactorAuth') as string}>
                    {!twoFactorEnabled && !twoFactorSecret && (
                        <div className="space-y-3">
                          <input type="password" value={passwordCheck} onChange={(e) => setPasswordCheck(e.target.value)} placeholder={t('profile.enterPassword') as string} className={inputBase} />
                          <button onClick={startTwoFactor} className={`${btnPrimary} w-full`} disabled={busy}>{t('profile.enable2fa')}</button>
                        </div>
                    )}
                    {twoFactorEnabled && !twoFactorSecret && (
                        <div className="space-y-3">
                          <input type="password" value={passwordCheck} onChange={(e) => setPasswordCheck(e.target.value)} placeholder={t('profile.enterPassword') as string} className={inputBase} />
                          <button onClick={stopTwoFactor} className={`${btnDanger} w-full`} disabled={busy}>{t('profile.disable2fa')}</button>
                        </div>
                    )}
                    {twoFactorSecret && (
                        <div className="space-y-4">
                          {otpAuthUrl && (
                              <div className="mx-auto w-max rounded-2xl border border-white/10 bg-white p-2">
                                <QRCode value={otpAuthUrl} size={220} />
                              </div>
                          )}
                          <p className="text-center text-sm">
                            <span className="cursor-pointer font-mono text-white/90" onClick={() => navigator.clipboard.writeText(twoFactorSecret)}>{twoFactorSecret}</span>
                          </p>
                        </div>
                    )}
                  </ModalContent>
                </Dialog>

                <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
                  <DialogTrigger asChild>
                    <button className={btnGhost}><BookOpen className="h-4 w-4" />{t('profile.recoveryWords')}</button>
                  </DialogTrigger>
                  <ModalContent title={t('profile.recoveryWords') as string}>
                    <div className="space-y-4">
                      <input type="password" value={regeneratePassword} onChange={(e) => setRegeneratePassword(e.target.value)} placeholder={t('profile.enterPassword') as string} className={inputBase} />
                      <button onClick={handleRegenerateWithVerify} className={`${btnPrimary} w-full`} disabled={busy}>{t('profile.generate')}</button>
                      {newSeed && (
                          <div className="mt-2 text-center">
                            <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {newSeed.split(' ').map((w, idx) => (
                                  <div key={idx} className="rounded-xl bg-white/5 px-3 py-1 text-sm ring-1 ring-white/10">
                                    {idx + 1}. {w}
                                  </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-center gap-4">
                              <button type="button" onClick={() => navigator.clipboard.writeText(newSeed)} className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"><Copy className="h-4 w-4" />{t('profile.copy')}</button>
                              <button
                                  type="button"
                                  onClick={() => {
                                    const blob = new Blob([JSON.stringify(newSeed.split(' '))], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url; link.download = 'words.json'; link.click(); URL.revokeObjectURL(url);
                                  }}
                                  className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"
                              >
                                <Download className="h-4 w-4" />{t('profile.download')}
                              </button>
                            </div>
                          </div>
                      )}
                    </div>
                  </ModalContent>
                </Dialog>
                {/*
                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                  <DialogTrigger asChild>
                    <button className={btnGhost}><Settings className="h-4 w-4" />{t('profile.settings')}</button>
                  </DialogTrigger>
                  <ModalContent title={t('profile.settings') as string}>
                    <p className="text-sm text-white/70">{t('profile.underDevelopment')}</p>
                  </ModalContent>
                </Dialog>*/}
              </div>
            </div>

            {/* Tips / Docs  className={card}*/}
            <div >
              <div className="text-sm text-white/70">{t('profile.tip', { defaultValue: 'Keep your recovery words in a safe place. Never share them.' })}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 w-full border-t border-white/10 bg-gray-900/60 px-5 py-4 backdrop-blur">
            <button onClick={handleLogout} className={`${btnGhost} w-full justify-center`}>
              <LogOut className="h-4 w-4" />{t('profile.logout')}
            </button>
          </div>
        </SheetContent>
      </Sheet>
  );
};
