import { useEffect, useMemo, useState } from 'react';
import { CreateOfferForm } from '@/components/CreateOfferForm';
import { getAssets, getPaymentMethods } from '@/api/dictionaries';
import { useTranslation } from 'react-i18next';

type AssetItem = { id?: string; ID?: string; asset_code?: string; name?: string; Name?: string };
type PaymentMethodItem = { id?: string; ID?: string; name?: string; Name?: string };
type Option = { value: string; label: string };

interface FilterPanelProps {
  filters: { fromAsset: string; toAsset: string; minAmount: string; maxAmount: string; paymentMethod: string };
  onFiltersChange: (filters: FilterPanelProps['filters']) => void;
  activeTab: 'buy' | 'sell';
  onTabChange: (tab: 'buy' | 'sell') => void;
}

const normalizeAsset = (x: AssetItem): Option => ({
  value: String(x.id ?? x.ID ?? x.asset_code ?? x.name ?? x.Name ?? ''),
  label: String(x.asset_code ?? x.name ?? x.Name ?? '')
});
const normalizePayment = (x: PaymentMethodItem): Option => ({
  value: String(x.id ?? x.ID ?? x.name ?? x.Name ?? ''),
  label: String(x.name ?? x.Name ?? '')
});

export const FilterPanel = ({
                              filters,
                              onFiltersChange,
                              activeTab,
                              onTabChange
                            }: FilterPanelProps) => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Option[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Option[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ——— Компактные стили под стиль offers ———
  const WRAP =
      '  bg-gradient-to-b from-gray-950/80 via-gray-900/70  text-white  mb-3';
  const FIELD =
      'h-9 px-3 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';
  const SELECT =
      `${FIELD} pr-8 appearance-none bg-no-repeat bg-right-3 bg-[length:1rem] min-w-[140px] sm:min-w-[160px] lg:min-w-[180px] ` +
      "bg-[url(\"data:image/svg+xml;utf8,<svg fill='white' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z' clip-rule='evenodd'/></svg>\")]";
  const INPUT = `${FIELD} w-full sm:w-[140px] lg:w-[160px]`;
  const BTN_PRIMARY =
      'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-3 h-9 text-sm font-semibold shadow transition';
  const LABEL = 'sr-only';
  const TABS_WRAP = 'inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10';
  const TAB = (active: boolean, kind: 'buy' | 'sell') =>
      `rounded-2xl px-3 h-8 text-sm font-medium ring-1 transition
   ${kind === 'buy'
          ? 'mr-[7px] ring-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
          : 'ring-rose-500/30 text-rose-300 hover:bg-rose-500/10'}
   ${active ? (kind === 'buy' ? 'bg-emerald-500/20 text-white' : 'bg-rose-500/20 text-white') : ''}`;


  const allOption = useMemo<Option>(() => ({ value: 'all', label: t('filters.all') }), [t]);
  const allMethodsOption = useMemo<Option>(() => ({ value: 'all', label: t('filters.allMethods') }), [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, pm] = await Promise.all([getAssets(), getPaymentMethods()]);
        if (cancelled) return;
        const assetOpts = (a as AssetItem[]).map(normalizeAsset).filter((o) => o.label);
        const pmOpts = (pm as PaymentMethodItem[]).map(normalizePayment).filter((o) => o.label);
        setAssets([allOption, ...assetOpts]);
        setPaymentMethods([allMethodsOption, ...pmOpts]);
      } catch {
        setAssets([allOption]);
        setPaymentMethods([allMethodsOption]);
      }
    })();
    return () => { cancelled = true; };
  }, [allOption, allMethodsOption]);

  const change = (patch: Partial<FilterPanelProps['filters']>) =>
      onFiltersChange({ ...filters, ...patch });

  return (
      <div className={WRAP}>
        {/* На больших — в одну строку. На маленьких — лучший UX с переносами. */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          {/* Табы */}
          <div className="flex items-center gap-2">
            <div className={TABS_WRAP}>
              <button
                  type="button"
                  data-testid="buy-tab"
                  onClick={() => onTabChange('buy')}
                  aria-pressed={activeTab === 'buy'}
                  className={TAB(activeTab === 'buy', 'buy')}
              >
                {t('filters.buy')}
              </button>
              <button
                  type="button"
                  data-testid="sell-tab"
                  onClick={() => onTabChange('sell')}
                  aria-pressed={activeTab === 'sell'}
                  className={TAB(activeTab === 'sell', 'sell')}
              >
                {t('filters.sell')}
              </button>
            </div>
          </div>

          {/* From / To */}
          <div className="flex gap-2">
            <label className={LABEL} htmlFor="from-asset">{t('filters.fromAsset')}</label>
            <select
                id="from-asset"
                data-testid="from-asset"
                value={filters.fromAsset}
                onChange={(e) => change({ fromAsset: e.target.value })}
                className={SELECT}
            >
              {assets.map((a) => (
                  <option key={a.value} value={a.value} title={a.label}>{a.label}</option>
              ))}
            </select>

            <label className={LABEL} htmlFor="to-asset">{t('filters.toAsset')}</label>
            <select
                id="to-asset"
                data-testid="to-asset"
                value={filters.toAsset}
                onChange={(e) => change({ toAsset: e.target.value })}
                className={SELECT}
            >
              {assets.map((a) => (
                  <option key={a.value} value={a.value} title={a.label}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Min / Max */}
          <div className="flex gap-2">
            <label className={LABEL} htmlFor="min-amount">{t('filters.min')}</label>
            <input
                id="min-amount"
                data-testid="min-amount"
                type="number"
                inputMode="decimal"
                placeholder={t('filters.min')}
                value={filters.minAmount}
                onChange={(e) => change({ minAmount: e.target.value })}
                className={INPUT}
            />
            <label className={LABEL} htmlFor="max-amount">{t('filters.max')}</label>
            <input
                id="max-amount"
                data-testid="max-amount"
                type="number"
                inputMode="decimal"
                placeholder={t('filters.max')}
                value={filters.maxAmount}
                onChange={(e) => change({ maxAmount: e.target.value })}
                className={INPUT}
            />
          </div>

          {/* Payment method */}
          <div className="flex">
            <label className={LABEL} htmlFor="payment-method">{t('filters.paymentMethod')}</label>
            <select
                id="payment-method"
                data-testid="payment-method"
                value={filters.paymentMethod}
                onChange={(e) => change({ paymentMethod: e.target.value })}
                className={`${SELECT} w-full sm:w-[200px] lg:w-[220px]`}
            >
              {paymentMethods.map((m) => (
                  <option key={m.value} value={m.value} title={m.label}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Create */}
          <div className="ms-auto">
            <button
                type="button"
                data-testid="create-advert"
                onClick={() => setShowCreateForm(true)}
                className={BTN_PRIMARY}
            >
              + {t('filters.createAdvert')}
            </button>
          </div>
        </div>

        {showCreateForm && (
            <CreateOfferForm onClose={() => setShowCreateForm(false)} />
        )}
      </div>
  );
};
