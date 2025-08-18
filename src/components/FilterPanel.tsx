import { useEffect, useMemo, useState } from 'react';
import { CreateOfferForm } from '@/components/CreateOfferForm';
import { getAssets, getPaymentMethods } from '@/api/dictionaries';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context';
import { useNavigate } from 'react-router-dom';

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
  label: String(x.asset_code ?? x.name ?? x.Name ?? ''),
});
const normalizePayment = (x: PaymentMethodItem): Option => ({
  value: String(x.id ?? x.ID ?? x.name ?? x.Name ?? ''),
  label: String(x.name ?? x.Name ?? ''),
});

export const FilterPanel = ({
                              filters,
                              onFiltersChange,
                              activeTab,
                              onTabChange,
                            }: FilterPanelProps) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Option[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Option[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const WRAP = 'bg-gradient-to-b from-gray-950/80 via-gray-900/70 text-white mb-3';
  const FIELD = 'h-9 px-3 bg-white/5 text-white placeholder-white/40 rounded-xl ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition';
  const SELECT = `${FIELD} pr-8 appearance-none bg-no-repeat bg-right-3 bg-[length:1rem] w-full`;
  const INPUT = `${FIELD} w-full`;
  const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white px-3 h-10 text-sm font-semibold shadow transition w-full lg:w-auto';
  const LABEL = 'sr-only';

  const TABS_WRAP = 'inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10';
  const TAB = (active: boolean, kind: 'buy' | 'sell') =>
      `text-center rounded-2xl px-4 h-10 text-sm font-medium transition
   ${kind === 'buy'
          ? (active
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'text-green-500 hover:bg-green-600/20')
          : (active
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'text-red-500 hover:bg-red-600/20')}`;

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

  const change = (patch: Partial<FilterPanelProps['filters']>) => onFiltersChange({ ...filters, ...patch });

  return (
      <div className={WRAP}>
        {/* Mobile: 3 строки, Desktop: остаётся в ряд */}
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-2">
          {/* 1) Tabs + Assets */}
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-row lg:items-center">
            <div className="flex justify-center sm:justify-start lg:mr-2">
              <div className="w-full grid grid-cols-2 gap-2 sm:inline-flex sm:w-auto">
                <button
                    type="button"
                    data-testid="buy-tab"
                    onClick={() => onTabChange('buy')}
                    aria-pressed={activeTab === 'buy'}
                    className={TAB(activeTab === 'buy', 'buy') + ' w-full sm:w-auto'}
                >
                  {t('filters.buy')}
                </button>
                <button
                    type="button"
                    data-testid="sell-tab"
                    onClick={() => onTabChange('sell')}
                    aria-pressed={activeTab === 'sell'}
                    className={TAB(activeTab === 'sell', 'sell') + ' w-full sm:w-auto'}
                >
                  {t('filters.sell')}
                </button>
              </div>

            </div>

            <div className="flex flex-1 gap-2">
              <select id="from-asset" data-testid="from-asset" value={filters.fromAsset} onChange={(e) => change({ fromAsset: e.target.value })} className={SELECT}>
                {assets.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
              </select>
              <select id="to-asset" data-testid="to-asset" value={filters.toAsset} onChange={(e) => change({ toAsset: e.target.value })} className={SELECT}>
                {assets.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
              </select>
            </div>
          </div>

          {/* 2) Payment + Min/Max */}
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-row lg:items-center">
            <div className="flex flex-1 lg:w-auto">
              <select id="payment-method" data-testid="payment-method" value={filters.paymentMethod} onChange={(e) => change({ paymentMethod: e.target.value })} className={SELECT}>
                {paymentMethods.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
            <div className="flex flex-1 gap-2 lg:w-auto">
              <input id="min-amount" data-testid="min-amount" type="number" placeholder={t('filters.min')} value={filters.minAmount} onChange={(e) => change({ minAmount: e.target.value })} className={INPUT} />
              <input id="max-amount" data-testid="max-amount" type="number" placeholder={t('filters.max')} value={filters.maxAmount} onChange={(e) => change({ maxAmount: e.target.value })} className={INPUT} />
            </div>
          </div>

          {/* 3) Create button */}
          <div className="flex w-full lg:w-auto lg:ml-auto">
            <button
                type="button"
                data-testid="create-advert"
                onClick={() => (isAuthenticated ? setShowCreateForm(true) : navigate('/login'))}
                className={BTN_PRIMARY}
            >
              + {t('filters.createAdvert')}
            </button>
          </div>
        </div>

        {showCreateForm && <CreateOfferForm onClose={() => setShowCreateForm(false)} />}
      </div>
  );
};
