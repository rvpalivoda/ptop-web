import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { createOffer } from '@/api/offers';
import { getAssets, getCountries, getPaymentMethods } from '@/api/dictionaries';
import {
  getClientPaymentMethods,
  createClientPaymentMethod,
  CreateClientPaymentMethodPayload,
} from '@/api/clientPaymentMethods';

interface CreateOfferFormProps {
  onClose: () => void;
}

interface AssetOption {
  id: string;
  name: string;
}

interface ClientPaymentMethodOption {
  id: string;
  name: string;
}

export const CreateOfferForm = ({ onClose }: CreateOfferFormProps) => {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ClientPaymentMethodOption[]>([]);

  const [formData, setFormData] = useState({
    fromAssetId: '',
    toAssetId: '',
    price: '',
    amount: '',
    minAmount: '',
    maxAmount: '',
    orderExpirationTimeout: 15,
    conditions: '',
    paymentMethodIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [baseMethods, setBaseMethods] = useState<{ id: string; name: string }[]>([]);
  const [newMethod, setNewMethod] = useState<CreateClientPaymentMethodPayload>({
    city: '',
    country_id: '',
    name: '',
    payment_method_id: '',
    post_code: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const a = await getAssets();
        const mapped = a.map((x: any) => ({
          id: x.id ?? x.asset_code ?? x.name ?? x,
          name: x.name ?? x.asset_code ?? x.id ?? x,
        }));
        setAssets(mapped);
        if (mapped.length >= 2) {
          setFormData((f) => ({
            ...f,
            fromAssetId: mapped[0].id,
            toAssetId: mapped[1].id,
          }));
        }
        const methods = await getClientPaymentMethods();
        const mappedMethods = methods
          .map((m: any) => ({
            id: m.id ?? m.ID ?? '',
            name: m.name ?? m.Name ?? '',
          }))
          .filter((m) => m.id && m.name);
        setPaymentMethods(mappedMethods);
        const c = await getCountries();
        setCountries(c.map((x: any) => ({ id: x.id ?? x.name ?? x, name: x.name ?? x.id ?? x })));
      } catch (err) {
        console.error('load dictionaries error:', err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadBaseMethods() {
      if (!newMethod.country_id) return;
      try {
        const countryName = countries.find((c) => c.id === newMethod.country_id)?.name;
        const list = await getPaymentMethods(countryName);
        setBaseMethods(list.map((x: any) => ({ id: x.id ?? x.name ?? x, name: x.name ?? x.id ?? x })));
      } catch (err) {
        console.error('load base methods error:', err);
      }
    }
    loadBaseMethods();
  }, [newMethod.country_id, countries]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fromAssetId) e.fromAssetId = 'Обязательное поле';
    if (!formData.toAssetId) e.toAssetId = 'Обязательное поле';
    if (formData.fromAssetId && formData.fromAssetId === formData.toAssetId)
      e.toAssetId = 'Активы должны различаться';
    if (!formData.price) e.price = 'Обязательное поле';
    if (!formData.amount) e.amount = 'Обязательное поле';
    if (!formData.minAmount) e.minAmount = 'Обязательное поле';
    if (!formData.maxAmount) e.maxAmount = 'Обязательное поле';
    if (Number(formData.minAmount) <= 0) e.minAmount = 'Мин. сумма должна быть > 0';
    if (Number(formData.maxAmount) <= 0) e.maxAmount = 'Макс. сумма должна быть > 0';
    if (Number(formData.minAmount) >= Number(formData.maxAmount))
      e.maxAmount = 'Макс. сумма должна быть больше мин.';
    if (formData.orderExpirationTimeout < 15)
      e.orderExpirationTimeout = 'Минимум 15 минут';
    if (!formData.conditions.trim()) e.conditions = 'Обязательное поле';
    if (formData.paymentMethodIds.filter(Boolean).length === 0)
      e.paymentMethodIds = 'Выберите хотя бы один метод оплаты';
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
      await createOffer({
        amount: formData.amount,
        client_payment_method_ids: formData.paymentMethodIds,
        conditions: formData.conditions,
        from_asset_id: formData.fromAssetId,
        max_amount: formData.maxAmount,
        min_amount: formData.minAmount,
        order_expiration_timeout: formData.orderExpirationTimeout,
        price: formData.price,
        to_asset_id: formData.toAssetId,
      });
      toast('Объявление создано');
      onClose();
    } catch (err) {
      console.error('Create offer error:', err);
      toast(err instanceof Error ? err.message : 'Ошибка создания');
    }
  };

  const handleAddMethod = async () => {
    if (
      !newMethod.city ||
      !newMethod.country_id ||
      !newMethod.name ||
      !newMethod.payment_method_id ||
      !newMethod.post_code
    ) {
      toast('Заполните все поля платёжного метода');
      return;
    }
    try {
      const created = await createClientPaymentMethod(newMethod);
      const opt = {
        id: created.id ?? (created as any).ID ?? '',
        name: created.name ?? (created as any).Name ?? '',
      };
      if (opt.id && opt.name) {
        setPaymentMethods((p) => [...p, opt]);
        setFormData((f) => ({
          ...f,
          paymentMethodIds: [...f.paymentMethodIds, opt.id],
        }));
      }
      setShowAddMethod(false);
      setNewMethod({ city: '', country_id: '', name: '', payment_method_id: '', post_code: '' });
    } catch (err) {
      console.error('create client payment method error:', err);
      toast(err instanceof Error ? err.message : 'Ошибка создания метода');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Создать объявление</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Актив из
              </label>
              <select
                value={formData.fromAssetId}
                onChange={(e) =>
                  setFormData({ ...formData, fromAssetId: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.fromAssetId && (
                <p className="text-sm text-red-500 mt-1">{errors.fromAssetId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Актив в
              </label>
              <select
                value={formData.toAssetId}
                onChange={(e) =>
                  setFormData({ ...formData, toAssetId: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {assets
                  .filter((a) => a.id !== formData.fromAssetId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
              {errors.toAssetId && (
                <p className="text-sm text-red-500 mt-1">{errors.toAssetId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цена
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Объём
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Мин. сумма
              </label>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.minAmount && (
                <p className="text-sm text-red-500 mt-1">{errors.minAmount}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Макс. сумма
              </label>
              <input
                type="number"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.maxAmount && (
                <p className="text-sm text-red-500 mt-1">{errors.maxAmount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Тайм-аут сделки (мин)
              </label>
              <input
                type="number"
                min={15}
                value={formData.orderExpirationTimeout}
                onChange={(e) =>
                  setFormData({ ...formData, orderExpirationTimeout: Number(e.target.value) })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.orderExpirationTimeout && (
                <p className="text-sm text-red-500 mt-1">{errors.orderExpirationTimeout}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Способы оплаты
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {paymentMethods.map((pm) => (
                <label key={pm.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    checked={formData.paymentMethodIds.includes(pm.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          paymentMethodIds: [...formData.paymentMethodIds, pm.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          paymentMethodIds: formData.paymentMethodIds.filter((id) => id !== pm.id),
                        });
                      }
                    }}
                  />
                  <span className="text-gray-300 text-sm">{pm.name}</span>
                </label>
              ))}
            </div>
            {errors.paymentMethodIds && (
              <p className="text-sm text-red-500 mt-1">{errors.paymentMethodIds}</p>
            )}
            {!showAddMethod && (
              <button
                type="button"
                onClick={() => setShowAddMethod(true)}
                className="mt-2 text-blue-400 text-sm"
              >
                + Добавить платёжный метод
              </button>
            )}
            {showAddMethod && (
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="Название"
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <select
                  value={newMethod.country_id}
                  onChange={(e) => setNewMethod({ ...newMethod, country_id: e.target.value, payment_method_id: '' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Страна</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Город"
                  value={newMethod.city}
                  onChange={(e) => setNewMethod({ ...newMethod, city: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <input
                  type="text"
                  placeholder="Почтовый код"
                  value={newMethod.post_code}
                  onChange={(e) => setNewMethod({ ...newMethod, post_code: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <select
                  value={newMethod.payment_method_id}
                  onChange={(e) =>
                    setNewMethod({ ...newMethod, payment_method_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Платёжный метод</option>
                  {baseMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAddMethod}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMethod(false);
                      setNewMethod({ city: '', country_id: '', name: '', payment_method_id: '', post_code: '' });
                    }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Условия
            </label>
            <textarea
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.conditions && (
              <p className="text-sm text-red-500 mt-1">{errors.conditions}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
