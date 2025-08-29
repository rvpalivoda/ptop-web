import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type OrderFilters = {
  statuses: string[]; // empty = all
};

type Props = {
  filters: OrderFilters;
  onChange: (next: OrderFilters) => void;
};

const STATUS_VALUES = ['WAIT_PAYMENT', 'PAID', 'RELEASED', 'CANCELLED', 'DISPUTE'];

export function OrdersFilterPanel({ filters, onChange }: Props) {
  const { t } = useTranslation();

  const toggleStatus = (s: string) => {
    const set = new Set(filters.statuses);
    if (set.has(s)) set.delete(s); else set.add(s);
    onChange({ ...filters, statuses: Array.from(set) });
  };

  const clear = () => onChange({ statuses: [] });

  const WRAP = 'rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 mb-4';

  return (
    <div className={WRAP}>
      {/* Status chips */}
      <div>
        <div className="flex flex-wrap gap-2">
          {STATUS_VALUES.map((s) => {
            const active = filters.statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={[
                  'px-2.5 py-1 rounded-full text-xs ring-1 transition',
                  active ? 'bg-white/20 text-white ring-white/20' : 'bg-white/5 text-white/80 ring-white/10 hover:bg-white/10'
                ].join(' ')}
                aria-pressed={active}
                title={t(`orderStatus.${s}`, s) as string}
              >
                {t(`orderStatus.${s}`, s)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
