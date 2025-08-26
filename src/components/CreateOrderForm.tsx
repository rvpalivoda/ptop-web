import { useState } from 'react';
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
const sectionCard = 'rounded-2xl border border-white/10 bg-gray-900/60 p-4';

export const CreateOrderForm = ({
  offerId,
  limits,
  paymentMethods,
  onClose,
}: CreateOrderFormProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    amount: '',
    clientPaymentMethodId: '',
    pinCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!formData.pinCode) e.pinCode = t('createOrder.errors.required');
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }
    try {
      await createOrder({
        amount: formData.amount,
        client_payment_method_id: formData.clientPaymentMethodId,
        offer_id: offerId,
        pin_code: formData.pinCode,
      });
      toast.success(t('createOrder.toast.success'));
      onClose();
    } catch (err) {
      console.error('create order error:', err);
      toast.error(t('createOrder.toast.error'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-gray-900/80 shadow-lg backdrop-blur">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('createOrder.title')}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className={sectionCard}>
              <label className="mb-1 block text-sm font-medium text-white/80">{t('createOrder.amount')}</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={inputBase}
              />
              {errors.amount && <p className="mt-1 text-xs text-rose-300">{errors.amount}</p>}
            </div>
            <div className={sectionCard}>
              <label className="mb-1 block text-sm font-medium text-white/80">{t('createOrder.paymentMethod')}</label>
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
            <div className={sectionCard}>
              <label className="mb-1 block text-sm font-medium text-white/80">{t('createOrder.pinCode')}</label>
              <input
                type="password"
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                className={inputBase}
              />
              {errors.pinCode && <p className="mt-1 text-xs text-rose-300">{errors.pinCode}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={onClose} className={btnSoft}>
                {t('createOrder.cancel')}
              </button>
              <button type="submit" className={btnPrimary}>
                {t('createOrder.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

