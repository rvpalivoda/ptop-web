import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/sonner';
import { createOrder } from '@/api/orders';
import type { ClientPaymentMethod } from '@/api/clientPaymentMethods';

interface CreateOrderFormProps {
  offerId: string;
  limits: { min: string; max: string };
  paymentMethods: ClientPaymentMethod[];
  onClose: () => void;
}

const inputBase =
    'w-full px-3.5 py-2.5 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition ';
const selectBase = inputBase + ' bg-gray-900 text-gray';
const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow transition disabled:opacity-60';
const btnSoft =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 transition';
const btnGhost =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white';

const PIN_LEN = 4;

export const CreateOrderForm = ({
                                  offerId,
                                  limits,
                                  paymentMethods,
                                  onClose,
                                }: CreateOrderFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    amount: limits?.min ?? '',
    clientPaymentMethodId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- PIN state (массив цифр) ---
  const [pinDigits, setPinDigits] = useState<string[]>(Array(PIN_LEN).fill(''));
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // при открытии формы фокус на первое пустое поле PIN (если нужно — можно убрать)
    const firstEmpty = pinDigits.findIndex((d) => d === '');
    if (firstEmpty >= 0) pinRefs.current[firstEmpty]?.focus();
  }, []); // eslint-disable-line

  // Скрыть нижнее фиксированное меню на время создания/редактирования заказа
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent('bottomnav-hide')); } catch {}
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      try { window.dispatchEvent(new CustomEvent('bottomnav-show')); } catch {}
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const setPinAt = (idx: number, val: string) => {
    setPinDigits((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const moveFocus = (idx: number, dir: -1 | 1) => {
    const next = Math.min(PIN_LEN - 1, Math.max(0, idx + dir));
    pinRefs.current[next]?.focus();
    pinRefs.current[next]?.select();
  };

  const handleDigitChange = (idx: number, raw: string) => {
    // берём только цифры
    const onlyDigits = raw.replace(/\D/g, '');
    if (!onlyDigits) {
      setPinAt(idx, '');
      return;
    }
    // если пользователь вставил несколько цифр в одно поле — раскидываем по инпутам
    const digits = onlyDigits.split('').slice(0, PIN_LEN);
    setPinDigits((prev) => {
      const next = [...prev];
      let cursor = idx;
      digits.forEach((d) => {
        next[cursor] = d;
        cursor = Math.min(PIN_LEN - 1, cursor + 1);
      });
      // переведём фокус на следующее после последней вставленной
      const lastIdx = Math.min(PIN_LEN - 1, idx + digits.length - 1);
      if (lastIdx < PIN_LEN - 1) moveFocus(lastIdx, 1);
      return next;
    });
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key === 'Backspace') {
      if (pinDigits[idx]) {
        // стираем текущую цифру
        setPinAt(idx, '');
      } else {
        // если пусто — переходим назад и стираем там
        if (idx > 0) {
          moveFocus(idx, -1);
          setTimeout(() => {
            const prevIdx = idx - 1;
            setPinAt(prevIdx, '');
          }, 0);
        }
      }
      e.preventDefault();
      return;
    }
    if (key === 'ArrowLeft') {
      moveFocus(idx, -1);
      e.preventDefault();
      return;
    }
    if (key === 'ArrowRight') {
      moveFocus(idx, 1);
      e.preventDefault();
      return;
    }
    // ограничим ввод только цифрами с клавиатуры
    if (key.length === 1 && !/[0-9]/.test(key)) {
      e.preventDefault();
    }
  };

  const handleDigitPaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text') ?? '';
    const digits = text.replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    setPinDigits((prev) => {
      const next = [...prev];
      let cursor = idx;
      digits.slice(0, PIN_LEN).forEach((d) => {
        next[cursor] = d;
        cursor = Math.min(PIN_LEN - 1, cursor + 1);
      });
      const last = Math.min(PIN_LEN - 1, idx + digits.length - 1);
      if (last < PIN_LEN - 1) moveFocus(last, 1);
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.amount) e.amount = t('createOrder.errors.required');
    const min = Number(limits.min);
    const max = Number(limits.max);
    const num = Number(formData.amount);
    if (formData.amount && (isNaN(num) || num < min || num > max)) {
      e.amount = t('createOrder.errors.amountLimits');
    }
    if (!formData.clientPaymentMethodId) e.clientPaymentMethodId = t('createOrder.errors.required');

    const pin = pinDigits.join('');
    if (pin.length !== PIN_LEN) e.pinCode = t('createOrder.errors.required'); // при желании сделай отдельный текст для длины
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isAuthenticated) { navigate('/register'); return; }
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      // сфокусируемся на первом пустом pin-поле, если ошибка по pin
      if (eMap.pinCode) {
        const firstEmpty = pinDigits.findIndex((d) => d === '');
        if (firstEmpty >= 0) pinRefs.current[firstEmpty]?.focus();
      }
      return;
    }
    try {
      await createOrder({
        amount: formData.amount,
        client_payment_method_id: formData.clientPaymentMethodId,
        offer_id: offerId,
        pin_code: pinDigits.join(''),
      });
      toast.success(t('createOrder.toast.success'));
      onClose();
    } catch (err) {
      console.error('create order error:', err);
      toast.error(t('createOrder.toast.error'));
    }
  };

  return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={String(t('createOrder.title'))}
        className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-0 sm:p-2 backdrop-blur"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full sm:max-w-md h-auto flex flex-col overflow-hidden rounded-none sm:rounded-2xl border border-white/10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t('createOrder.title')}</h2>
            <button onClick={onClose} className={`${btnGhost} !px-2 !py-1 tap-manipulation`} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body (без скролла) */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 px-5 py-5 pb-0 grid gap-4">
              {/* amount */}
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">
                  {t('createOrder.amount')}
                </label>
                <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={inputBase}
                />
                {errors.amount && <p className="mt-1 text-xs text-rose-300">{errors.amount}</p>}
              </div>

              {/* payment method */}
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">
                  {t('createOrder.paymentMethod')}
                </label>
                <select
                    value={formData.clientPaymentMethodId}
                    onChange={(e) => setFormData({ ...formData, clientPaymentMethodId: e.target.value })}
                    className={selectBase}
                >
                  <option value="">{t('createOrder.paymentMethod')}</option>
                  {paymentMethods.map((pm) => (
                      <option key={pm.id ?? pm.ID} value={pm.id ?? pm.ID}>
                        {pm.name ?? pm.Name}
                      </option>
                  ))}
                </select>
                {errors.clientPaymentMethodId && (
                    <p className="mt-1 text-xs text-rose-300">{errors.clientPaymentMethodId}</p>
                )}
              </div>

              {/* PIN: по одной цифре */}
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">
                  {t('createOrder.pinCode')}
                </label>
                <div className="flex gap-2">
                  {pinDigits.map((val, idx) => (
                      <input
                          key={idx}
                          ref={(el) => (pinRefs.current[idx] = el)}
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={(e) => handleDigitPaste(idx, e)}
                          className={`w-12 text-center text-2xl font-bold tracking-widest ${inputBase}`}
                          aria-label={`${t('createOrder.pinCode')} ${idx + 1}`}
                      />
                  ))}
                </div>
                {errors.pinCode && <p className="mt-1 text-xs text-rose-300">{errors.pinCode}</p>}
              </div>

              {/* Footer actions (аналогично CreateOfferForm) */}
            <div className="sticky bottom-0 -mx-5 mt-5 flex items-center justify-end gap-2 border-t border-white/10 bg-gray-900/60 pr-5 pl-0 pt-3 pb-safe backdrop-blur m-0">
                <button type="button" onClick={onClose} className={`${btnSoft} tap-manipulation`}>
                  {t('createOrder.cancel')}
                </button>
                <button type="submit" className={`${btnPrimary} tap-manipulation`}>
                  {t('createOrder.create')}
                </button>
              </div>
            </form>
        </div>
      </div>
  );
};
