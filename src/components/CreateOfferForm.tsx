import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Info, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { createOffer, updateOffer, Offer } from '@/api/offers';
import { getAssets, getCountries, getPaymentMethods } from '@/api/dictionaries';
import {
  getClientPaymentMethods,
  createClientPaymentMethod,
  CreateClientPaymentMethodPayload,
} from '@/api/clientPaymentMethods';

interface CreateOfferFormProps {
  onClose: () => void;
  offer?: Offer;
}

interface AssetOption { id: string; name: string }
interface ClientPaymentMethodOption { id: string; name: string }

const inputBase =
    'w-full px-3.5 py-2.5 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';
const selectBase = inputBase;
const textareaBase = inputBase + ' min-h-[120px]';
const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold shadow transition disabled:opacity-60';
const btnGhost =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white';
const btnSoft =
    'inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 transition';
const sectionCard = 'rounded-2xl border border-white/10 bg-gray-900/60 p-4';

export const CreateOfferForm = ({ onClose, offer }: CreateOfferFormProps) => {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ClientPaymentMethodOption[]>([]);

  const [formData, setFormData] = useState({
    type: (offer?.type ?? 'buy') as 'buy' | 'sell',
    fromAssetId: offer?.fromAssetID ?? '',
    toAssetId: offer?.toAssetID ?? '',
    price: offer ? String(offer.price) : '',
    amount: offer ? String(offer.amount) : '',
    minAmount: offer ? String(offer.minAmount) : '',
    maxAmount: offer ? String(offer.maxAmount) : '',
    orderExpirationTimeout: offer?.orderExpirationTimeout ?? 15,
    conditions: offer?.conditions ?? '',
    paymentMethodIds: offer?.clientPaymentMethodIDs ?? ([] as string[]),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [baseMethods, setBaseMethods] = useState<{ id: string; name: string }[]>([]);
  const [newMethod, setNewMethod] = useState<CreateClientPaymentMethodPayload>({
    city: '', country_id: '', name: '', payment_method_id: '', post_code: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const a = await getAssets();
        const mapped = a.map((x: any) => ({ id: x.id ?? x.asset_code ?? x.name ?? x, name: x.name ?? x.asset_code ?? x.id ?? x }));
        setAssets(mapped);
        if (mapped.length >= 2) {
          setFormData((f) => ({ ...f, fromAssetId: f.fromAssetId || mapped[0].id, toAssetId: f.toAssetId || mapped[1].id }));
        }
        const methods = await getClientPaymentMethods();
        const mappedMethods = methods
            .map((m: any) => ({ id: m.id ?? m.ID ?? '', name: m.name ?? m.Name ?? '' }))
            .filter((m: any) => m.id && m.name);
        setPaymentMethods(mappedMethods);

        const c = await getCountries();
        setCountries(c.map((x: any) => ({ id: x.id ?? x.name ?? x, name: x.name ?? x.id ?? x })));
      } catch (err) { console.error('load dictionaries error:', err); }
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
      } catch (err) { console.error('load base methods error:', err); }
    }
    loadBaseMethods();
  }, [newMethod.country_id, countries]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fromAssetId) e.fromAssetId = 'Обязательное поле';
    if (!formData.toAssetId) e.toAssetId = 'Обязательное поле';
    if (formData.fromAssetId && formData.fromAssetId === formData.toAssetId) e.toAssetId = 'Активы должны различаться';
    if (formData.type !== 'buy' && formData.type !== 'sell') e.type = 'Обязательное поле';
    if (!formData.price) e.price = 'Обязательное поле';
    if (!formData.amount) e.amount = 'Обязательное поле';
    if (!formData.minAmount) e.minAmount = 'Обязательное поле';
    if (!formData.maxAmount) e.maxAmount = 'Обязательное поле';
    if (Number(formData.minAmount) <= 0) e.minAmount = 'Мин. сумма должна быть > 0';
    if (Number(formData.maxAmount) <= 0) e.maxAmount = 'Макс. сумма должна быть > 0';
    if (Number(formData.minAmount) >= Number(formData.maxAmount)) e.maxAmount = 'Макс. сумма должна быть больше мин.';
    if (formData.orderExpirationTimeout < 15) e.orderExpirationTimeout = 'Минимум 15 минут';
    if (!formData.conditions.trim()) e.conditions = 'Обязательное поле';
    if (formData.paymentMethodIds.filter(Boolean).length === 0) e.paymentMethodIds = 'Выберите хотя бы один метод оплаты';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) { setErrors(eMap); return; }
    try {
      const payload = {
        amount: formData.amount,
        client_payment_method_ids: formData.paymentMethodIds,
        conditions: formData.conditions,
        type: formData.type,
        from_asset_id: formData.fromAssetId,
        max_amount: formData.maxAmount,
        min_amount: formData.minAmount,
        order_expiration_timeout: formData.orderExpirationTimeout,
        price: formData.price,
        to_asset_id: formData.toAssetId,
      };
      if (offer) { await updateOffer(offer.id, payload); toast('Объявление обновлено'); }
      else { await createOffer(payload); toast('Объявление создано'); }
      onClose();
    } catch (err) {
      console.error('Create offer error:', err);
      toast(err instanceof Error ? err.message : 'Ошибка создания');
    }
  };

  const handleAddMethod = async () => {
    if (!newMethod.city || !newMethod.country_id || !newMethod.name || !newMethod.payment_method_id || !newMethod.post_code) {
      toast('Заполните все поля платёжного метода');
      return;
    }
    try {
      const created = await createClientPaymentMethod(newMethod);
      const opt = { id: (created as any).id ?? (created as any).ID ?? '', name: (created as any).name ?? (created as any).Name ?? '' };
      if (opt.id && opt.name) {
        setPaymentMethods((p) => [...p, opt]);
        setFormData((f) => ({ ...f, paymentMethodIds: [...f.paymentMethodIds, opt.id] }));
      }
      setShowAddMethod(false);
      setNewMethod({ city: '', country_id: '', name: '', payment_method_id: '', post_code: '' });
    } catch (err) {
      console.error('create client payment method error:', err);
      toast(err instanceof Error ? err.message : 'Ошибка создания метода');
    }
  };

  const typeTabs = (
      <div className="inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
        {(['buy', 'sell'] as const).map((k) => (
            <button
                key={k}
                type="button"
                onClick={() => setFormData({ ...formData, type: k })}
                   className={`mr-[5px] last:mr-0 rounded-2xl px-4 py-2.5 text-sm font-medium ring-1 transition 
           ${k === 'buy'
                     ? 'ring-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 data-[active=true]:bg-emerald-500/20'
                       : 'ring-rose-500/30 text-rose-300 hover:bg-rose-500/10 data-[active=true]:bg-rose-500/20'
                    } data-[active=true]:text-white`}
                data-active={formData.type === k}
            >
              {k === 'buy' ? 'Купить' : 'Продать'}
            </button>
        ))}
      </div>
  );

  const selectedPaymentChips = useMemo(() => {
    if (!formData.paymentMethodIds.length) return null;
    const map = new Map(paymentMethods.map((m) => [m.id, m.name]));
    return (
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.paymentMethodIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
            <Check className="h-3.5 w-3.5" />{map.get(id) || id}
          </span>
          ))}
        </div>
    );
  }, [formData.paymentMethodIds, paymentMethods]);

  return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur">
         <div className="w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{offer ? 'Редактировать объявление' : 'Создать объявление'}</h2>
              <p className="mt-0.5 text-xs text-white/60">Заполните поля ниже. Все значения можно изменить позже.</p>
            </div>
            <button onClick={onClose} className={`${btnGhost} !px-2 !py-1`} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-5 py-5 pb-0">
            <div className="grid grid-cols-1 gap-4">
              {/* Тип сделки */}
              <div className={sectionCard}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold uppercase tracking-wide text-white/60">Тип сделки</div>
                  {typeTabs}
                </div>
                {errors.type && <p className="text-xs text-rose-300">{errors.type}</p>}
              </div>

              {/* Активы */}
              <div className={sectionCard}>
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">Активы</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Актив из</label>
                    <select value={formData.fromAssetId} onChange={(e) => setFormData({ ...formData, fromAssetId: e.target.value })} className={selectBase}>
                      {assets.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                    {errors.fromAssetId && <p className="mt-1 text-xs text-rose-300">{errors.fromAssetId}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Актив в</label>
                    <select value={formData.toAssetId} onChange={(e) => setFormData({ ...formData, toAssetId: e.target.value })} className={selectBase}>
                      {assets.filter((a) => a.id !== formData.fromAssetId).map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                    {errors.toAssetId && <p className="mt-1 text-xs text-rose-300">{errors.toAssetId}</p>}
                  </div>
                </div>
              </div>

              {/* Параметры */}
              <div className={sectionCard}>
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">Параметры</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Цена</label>
                    <input type="number" inputMode="decimal" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputBase} />
                    {errors.price && <p className="mt-1 text-xs text-rose-300">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Объём</label>
                    <input type="number" inputMode="decimal" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className={inputBase} />
                    {errors.amount && <p className="mt-1 text-xs text-rose-300">{errors.amount}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Мин. сумма</label>
                    <input type="number" inputMode="decimal" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })} className={inputBase} />
                    {errors.minAmount && <p className="mt-1 text-xs text-rose-300">{errors.minAmount}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Макс. сумма</label>
                    <input type="number" inputMode="decimal" value={formData.maxAmount} onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })} className={inputBase} />
                    {errors.maxAmount && <p className="mt-1 text-xs text-rose-300">{errors.maxAmount}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/60">Тайм-аут сделки (мин)</label>
                    <input type="number" min={15} value={formData.orderExpirationTimeout} onChange={(e) => setFormData({ ...formData, orderExpirationTimeout: Number(e.target.value) })} className={inputBase} />
                    {errors.orderExpirationTimeout && <p className="mt-1 text-xs text-rose-300">{errors.orderExpirationTimeout}</p>}
                    <div className="mt-1.5 flex items-start gap-2 text-xs text-white/60">
                      <Info className="mt-0.5 h-3.5 w-3.5" />
                      <span>Минимум 15 минут. Время, в течение которого контрагент должен завершить оплату.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Способы оплаты */}
              <div className={sectionCard}>
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">Способы оплаты</div>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethods.map((pm) => (
                      <label key={pm.id} className="group flex cursor-pointer items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 transition hover:bg-white/10">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-0"
                            checked={formData.paymentMethodIds.includes(pm.id)}
                            onChange={(e) => {
                              if (e.target.checked) setFormData({ ...formData, paymentMethodIds: [...formData.paymentMethodIds, pm.id] });
                              else setFormData({ ...formData, paymentMethodIds: formData.paymentMethodIds.filter((id) => id !== pm.id) });
                            }}
                        />
                        <span className="text-sm text-white/80">{pm.name}</span>
                      </label>
                  ))}
                </div>
                {errors.paymentMethodIds && <p className="mt-1 text-xs text-rose-300">{errors.paymentMethodIds}</p>}
                {selectedPaymentChips}

                {!showAddMethod ? (
                    <button type="button" onClick={() => setShowAddMethod(true)} className={`${btnSoft} mt-3`}>
                      <Plus className="h-4 w-4" /> Добавить платёжный метод
                    </button>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <input
                          type="text"
                          placeholder="Название"
                          value={newMethod.name}
                          onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                          className={inputBase}
                      />
                      <select
                          value={newMethod.country_id}
                          onChange={(e) => setNewMethod({ ...newMethod, country_id: e.target.value, payment_method_id: '' })}
                          className={selectBase}
                      >
                        <option value="">Страна</option>
                        {countries.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <input
                          type="text"
                          placeholder="Город"
                          value={newMethod.city}
                          onChange={(e) => setNewMethod({ ...newMethod, city: e.target.value })}
                          className={inputBase}
                      />
                      <input
                          type="text"
                          placeholder="Почтовый код"
                          value={newMethod.post_code}
                          onChange={(e) => setNewMethod({ ...newMethod, post_code: e.target.value })}
                          className={inputBase}
                      />
                      <select
                          value={newMethod.payment_method_id}
                          onChange={(e) => setNewMethod({ ...newMethod, payment_method_id: e.target.value })}
                          className={selectBase}
                      >
                        <option value="">Платёжный метод</option>
                        {baseMethods.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                      </select>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddMethod} className={`${btnPrimary} flex-1`}>Сохранить</button>
                        <button
                            type="button"
                            onClick={() => { setShowAddMethod(false); setNewMethod({ city: '', country_id: '', name: '', payment_method_id: '', post_code: '' }); }}
                            className={`${btnSoft} flex-1`}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                )}
              </div>

              {/* Условия */}
              <div className={sectionCard}>
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">Условия</div>
                <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className={textareaBase}
                />
                {errors.conditions && <p className="mt-1 text-xs text-rose-300">{errors.conditions}</p>}
                <div className="mt-1.5 flex items-start gap-2 text-xs text-white/60">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
                  <span>Опишите требования к платежу, лимиты, комиссию, окно завершения сделки и что делать, если оплата задерживается.</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 -mx-5 mt-5 flex items-center justify-end gap-2 border-t border-white/10 bg-gray-900/60 px-5 py-4 backdrop-blur m-0">
              <button type="button" onClick={onClose} className={btnSoft}>Отмена</button>
              <button type="submit" className={btnPrimary}>{offer ? 'Сохранить' : 'Создать'}</button>
            </div>
          </form>
        </div>
      </div>
  );
};
