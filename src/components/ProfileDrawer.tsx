import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  enable2fa,
  disable2fa,
  verifyPassword as apiVerifyPassword,
} from "@/api";
import { useAuth } from "@/context";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  clearTwoFactorEnabled,
  loadTwoFactorEnabled,
  saveTwoFactorEnabled,
} from "@/storage/two_factor";

const modalContentCls =
  "bg-gray-800 border border-gray-700 text-white sm:max-w-lg w-[calc(100vw-2rem)] sm:rounded-xl rounded-lg shadow-xl";

interface Props {
  triggerClassName?: string;
}

export const ProfileDrawer = ({ triggerClassName }: Props) => {
  const {
    userInfo,
    regenerateWords,
    changePassword,
    setPinCode,
    refresh,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [show2faDialog, setShow2faDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    userInfo?.twofaEnabled ?? loadTwoFactorEnabled(),
  );
  const [newSeed, setNewSeed] = useState<string | null>(null);
  const [regeneratePassword, setRegeneratePassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinPassword, setPinPassword] = useState("");
  const [pinCodeValue, setPinCodeValue] = useState("");
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pinDigits];
    next[index] = val;
    setPinDigits(next);
    setPinCodeValue(next.join(""));
    if (val && index < pinInputRefs.current.length - 1) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const inputStyles =
    "w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  useEffect(() => {
    if (twoFactorEnabled) {
      saveTwoFactorEnabled(true);
    } else {
      clearTwoFactorEnabled();
    }
  }, [twoFactorEnabled]);

  useEffect(() => {
    if (userInfo) {
      setTwoFactorEnabled(userInfo.twofaEnabled);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!show2faDialog) {
      setTwoFactorSecret(null);
      setOtpAuthUrl(null);
      setPasswordCheck("");
    }
  }, [show2faDialog]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert(t("profile.passwordMismatch"));
      return;
    }
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert(t("profile.passwordUpdated"));
    } catch (err) {
      console.error(err);
      alert(t("profile.passwordChangeError"));
    }
  };

  const verifyPasswordWith = async (pwd: string) => {
    try {
      await apiVerifyPassword(pwd);
      return true;
    } catch (err) {
      console.error(err);
      alert(t("profile.invalidPassword"));
      return false;
    }
  };

  const startTwoFactor = async () => {
    try {
      const res = await enable2fa(passwordCheck);
      setTwoFactorSecret(res.secret);
      setOtpAuthUrl(res.url);
      setTwoFactorEnabled(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopTwoFactor = async () => {
    try {
      await disable2fa(passwordCheck);
      setTwoFactorEnabled(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async () => {
    try {
      const res = await regenerateWords(regeneratePassword);
      const phrase = res.mnemonic
        .sort((a, b) => a.position - b.position)
        .map((w) => w.word)
        .join(" ");
      setNewSeed(phrase);
      setRegeneratePassword("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerateWithVerify = async () => {
    const ok = await verifyPasswordWith(regeneratePassword);
    if (ok) {
      await handleRegenerate();
    }
  };

  const handleSetPin = async () => {
    const ok = await verifyPasswordWith(pinPassword);
    if (!ok) return;
    try {
      await setPinCode(pinPassword, pinCodeValue);
      setPinPassword("");
      setPinCodeValue("");
      setPinDigits(["", "", "", ""]);
      setShowPinDialog(false);
      alert(t("profile.pinCodeSet"));
    } catch (err) {
      console.error(err);
      alert(t("profile.pinCodeError"));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={
            triggerClassName ||
            "flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          }
        >
          <User size={20} />
          <span className="hidden sm:block">{t("profile.title")}</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-gray-900 border-l border-gray-700 p-4 space-y-4 text-white flex flex-col h-full"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold mt-2 text-white">
            {t("profile.title")}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-2 text-sm">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(userInfo?.username)}
            className="flex items-center text-blue-500  font-semibold  hover:text-blue-300"
          >
            {userInfo?.username || ""} <Copy className="w-5 h-5 ml-2" />
          </button>
        </div>
        <div className="space-y-2 flex-1">
          <Dialog open={showPwdDialog} onOpenChange={setShowPwdDialog}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center bg-gray-700 text-white hover:bg-gray-600 px-4 py-2 rounded-md">
                <Key className="w-4 h-4 mr-2" />
                {t("profile.changePassword")}
              </button>
            </DialogTrigger>
            <DialogContent className={modalContentCls}>
              <DialogHeader>
                <DialogTitle>{t("profile.changePassword")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("profile.currentPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      className={`pr-10 ${inputStyles}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("profile.newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      className={`pr-10 ${inputStyles}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("profile.confirmNewPassword")}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={inputStyles}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors  block w-full mt-2"
                >
                  {t("profile.updatePassword")}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md">
                <KeyRound className="w-4 h-4 mr-2" />
                {t("profile.pinCode")}
              </button>
            </DialogTrigger>
            <DialogContent className={modalContentCls}>
            <DialogHeader>
              <DialogTitle>{t("profile.pinCodeSetup")}</DialogTitle>
            </DialogHeader>
              <div className="space-y-4 mt-4">
                <input
                  type="password"
                  value={pinPassword}
                  onChange={(e) => setPinPassword(e.target.value)}
                  placeholder={t("profile.enterPassword")}
                  className={inputStyles}
                />
                <div className="flex space-x-2">
                  {pinDigits.map((d, idx) => (
                    <input
                      key={idx}
                      type="text"
                      ref={(el) => (pinInputRefs.current[idx] = el)}
                      value={pinDigits[idx]}
                      maxLength={1}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-12 text-center text-2xl font-bold ${inputStyles}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSetPin}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700  block w-full mt-2"
                >
                  {t("profile.save")}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={show2faDialog} onOpenChange={setShow2faDialog}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md  ">
                <ShieldCheck className="w-4 h-4 mr-2" />
                {t("profile.twoFactorAuth")}
              </button>
            </DialogTrigger>
            <DialogContent className={modalContentCls}>
            <DialogHeader>
              <DialogTitle className="text-center">{t("profile.twoFactorAuth")}</DialogTitle>
            </DialogHeader>
              {!twoFactorEnabled && !twoFactorSecret && (
                <div className="space-y-4 mt-4">
                  <input
                    type="password"
                    value={passwordCheck}
                    onChange={(e) => setPasswordCheck(e.target.value)}
                    placeholder={t("profile.enterPassword")}
                    className={inputStyles}
                  />
                  <button
                    onClick={startTwoFactor}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700  block w-full mt-2"
                  >
                    {t("profile.enable2fa")}
                  </button>
                </div>
              )}
              {twoFactorEnabled && !twoFactorSecret && (
                <div className="space-y-4 mt-4">
                  <input
                    type="password"
                    value={passwordCheck}
                    onChange={(e) => setPasswordCheck(e.target.value)}
                    placeholder={t("profile.enterPassword")}
                    className={inputStyles}
                  />
                  <button
                    onClick={stopTwoFactor}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700  block w-full mt-2"
                  >
                    {t("profile.disable2fa")}
                  </button>
                </div>
              )}
              {twoFactorSecret && (
                <div className="mt-4 space-y-4">
                  {otpAuthUrl && (
                    <div className="mx-auto w-max bg-white p-2 rounded">
                      <QRCode value={otpAuthUrl} size={250} />
                    </div>
                  )}
                  <p
                    className="text-sm text-center cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(twoFactorSecret)}
                  >
                    <span className="font-mono break-all">
                      {twoFactorSecret}
                    </span>
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog
            open={showRecoveryDialog}
            onOpenChange={setShowRecoveryDialog}
          >
            <DialogTrigger asChild>
              <button className="w-full flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md    ">
                <BookOpen className="w-4 h-4 mr-2" />
                {t("profile.recoveryWords")}
              </button>
            </DialogTrigger>
            <DialogContent className={modalContentCls}>
            <DialogHeader>
              <DialogTitle>{t("profile.recoveryWords")}</DialogTitle>
            </DialogHeader>
              <div className="space-y-4 mt-4">
                <input
                  type="password"
                  value={regeneratePassword}
                  onChange={(e) => setRegeneratePassword(e.target.value)}
                  placeholder={t("profile.enterPassword")}
                  className={inputStyles}
                />
                <button
                  onClick={handleRegenerateWithVerify}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700  block w-full mt-2"
                >
                  {t("profile.generate")}
                </button>
                {newSeed && (
                  <div className="mt-4 text-center">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {newSeed.split(" ").map((w, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-md text-sm"
                        >
                          {idx + 1}. {w}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(newSeed)}
                        className="flex items-center text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="w-4 h-4 mr-1" /> {t("profile.copy")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob(
                            [JSON.stringify(newSeed.split(" "))],
                            { type: "application/json" },
                          );
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = "words.json";
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center text-blue-400 hover:text-blue-300"
                      >
                        <Download className="w-4 h-4 mr-1" /> {t("profile.download")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
          >
            <DialogTrigger asChild>
              <button className="w-full flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md  ">
                <Settings className="w-4 h-4 mr-2" />
                {t("profile.settings")}
              </button>
            </DialogTrigger>
            <DialogContent className={modalContentCls}>
            <DialogHeader>
              <DialogTitle>{t("profile.settings")}</DialogTitle>
            </DialogHeader>
              <p className="mt-4 text-sm text-gray-300">{t("profile.underDevelopment")}</p>
            </DialogContent>
          </Dialog>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md mt-auto"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("profile.logout")}
        </button>
        <SheetClose className="absolute right-4 top-4 text-gray-400 hover:text-white" />
      </SheetContent>
    </Sheet>
  );
};
