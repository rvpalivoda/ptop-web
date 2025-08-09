import { useEffect, useMemo, useState } from 'react';
import { getAssets, getPaymentMethods } from '@/api/dictionaries';
import { useTranslation } from 'react-i18next';

type AssetItem = {
  id?: string;
  ID?: string;
  asset_code?: string;
  name?: string;
  Name?: string;
};

type PaymentMethodItem = {
  id?: string;
  ID?: string;
  name?: string;
  Name?: string;
};

type Option = { value: string; label: string };

interface FilterPanelProps {
  filters: {
    fromAsset: string;
    toAsset: string;
    minAmount: string;
    maxAmount: string;
    paymentMethod: string;
  };
  onFiltersChange: (filters: {
    fromAsset: string;
    toAsset: string;
    minAmount: string;
    maxAmount: string;
    paymentMethod: string;
  }) => void;
  activeTab: 'buy' | 'sell';
  onTabChange: (tab: 'buy' | 'sell') => void;
  onCreate: () => void;
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
                              onTabChange,
                              onCreate
                            }: FilterPanelProps) => {
  const { t } = useTranslation();

  const [assets, setAssets] = useState<Option[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Option[]>([]);

  // Базовые классы для единой высоты и внешнего вида
  const FIELD_BASE =
      'bg-gray-700 border border-gray-600 rounded-md px-2 text-white focus:outline-none h-10';
  const INPUT_CLS = `${FIELD_BASE} placeholder-gray-400`;
  const SELECT_CLS =
      'bg-gray-700 border border-gray-600 rounded-md px-2 pr-8 text-white focus:outline-none h-10 appearance-none bg-no-repeat bg-right-2 bg-[length:1rem] ' +
      "bg-[url(\"data:image/svg+xml;utf8,<svg fill='white' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z' clip-rule='evenodd'/></svg>\")]";

  const TAB_BTN_BASE =
      'w-1/2 sm:w-24 px-3 text-sm h-10 flex items-center justify-center transition-colors';
  const CREATE_BTN_CLS =
      'w-full sm:w-auto sm:ml-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 rounded-md font-medium transition-all h-10 flex items-center justify-center';

  const allOption = useMemo<Option>(() => ({ value: 'all', label: t('filters.all') }), [t]);
  const allMethodsOption = useMemo<Option>(
      () => ({ value: 'all', label: t('filters.allMethods') }),
      [t]
  );

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
      } catch (err) {
        console.error('load dictionaries error:', err);
        // даже при ошибке выставим "все" чтобы UI не ломался
        setAssets([allOption]);
        setPaymentMethods([allMethodsOption]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allOption, allMethodsOption]);

  const change = (patch: Partial<FilterPanelProps['filters']>) =>
      onFiltersChange({ ...filters, ...patch });

  return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* From / To */}
          <div className="flex w-full gap-2 sm:w-auto">
            <label className="sr-only" htmlFor="from-asset">
              {t('filters.fromAsset')}
            </label>
            <select
                id="from-asset"
                data-testid="from-asset"
                value={filters.fromAsset}
                onChange={(e) => change({ fromAsset: e.target.value })}
                className={`w-1/2 sm:w-auto ${SELECT_CLS}`}
            >
              {assets.map((a) => (
                  <option key={`${a.value}`} value={a.value}>
                    {a.label}
                  </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="to-asset">
              {t('filters.toAsset')}
            </label>
            <select
                id="to-asset"
                data-testid="to-asset"
                value={filters.toAsset}
                onChange={(e) => change({ toAsset: e.target.value })}
                className={`w-1/2 sm:w-auto ${SELECT_CLS}`}
            >
              {assets.map((a) => (
                  <option key={`${a.value}`} value={a.value}>
                    {a.label}
                  </option>
              ))}
            </select>
          </div>

          {/* Min / Max */}
          <div className="flex w-full gap-2 sm:w-auto">
            <label className="sr-only" htmlFor="min-amount">
              {t('filters.min')}
            </label>
            <input
                id="min-amount"
                data-testid="min-amount"
                type="number"
                inputMode="decimal"
                placeholder={t('filters.min')}
                value={filters.minAmount}
                onChange={(e) => change({ minAmount: e.target.value })}
                className={`w-1/2 sm:w-36 ${INPUT_CLS}`}
            />

            <label className="sr-only" htmlFor="max-amount">
              {t('filters.max')}
            </label>
            <input
                id="max-amount"
                data-testid="max-amount"
                type="number"
                inputMode="decimal"
                placeholder={t('filters.max')}
                value={filters.maxAmount}
                onChange={(e) => change({ maxAmount: e.target.value })}
                className={`w-1/2 sm:w-36 ${INPUT_CLS}`}
            />
          </div>

          {/* Payment method */}
          <label className="sr-only" htmlFor="payment-method">
            {t('filters.paymentMethod')}
          </label>
          <select
              id="payment-method"
              data-testid="payment-method"
              value={filters.paymentMethod}
              onChange={(e) => change({ paymentMethod: e.target.value })}
              className={`w-full sm:w-auto ${SELECT_CLS}`}
          >
            {paymentMethods.map((m) => (
                <option key={`${m.value}`} value={m.value}>
                  {m.label}
                </option>
            ))}
          </select>

          {/* Tabs */}
          <div className="flex w-full sm:w-auto rounded-md overflow-hidden border border-gray-600">
            <button
                type="button"
                data-testid="buy-tab"
                onClick={() => onTabChange('buy')}
                aria-pressed={activeTab === 'buy'}
                className={`${TAB_BTN_BASE} ${
                    activeTab === 'buy' ? 'bg-green-600 text-white' : 'text-gray-300'
                }`}
            >
              {t('filters.buy')}
            </button>
            <button
                type="button"
                data-testid="sell-tab"
                onClick={() => onTabChange('sell')}
                aria-pressed={activeTab === 'sell'}
                className={`${TAB_BTN_BASE} ${
                    activeTab === 'sell' ? 'bg-red-600 text-white' : 'text-gray-300'
                }`}
            >
              {t('filters.sell')}
            </button>
          </div>

          {/* Create Advert */}
          <button type="button" onClick={onCreate} className={CREATE_BTN_CLS}>
            + {t('filters.createAdvert')}
          </button>
        </div>
      </div>
  );
};
