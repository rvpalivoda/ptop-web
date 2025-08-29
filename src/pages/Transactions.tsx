import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import {
  getIncomingTransactions,
  getInternalTransactions,
  getOutgoingTransactions,
  BaseTransaction,
} from '@/api';
import { ArrowDownRight, ArrowUpRight, Shuffle } from 'lucide-react';

const LIMIT = 10;

type TabKey = 'in' | 'internal' | 'out';

type StatusTone = {
  bg: string;
  text: string;
  ring: string;
};

const statusTones: Record<string, StatusTone> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-300', ring: 'ring-amber-500/30' },
  processing: { bg: 'bg-sky-500/10', text: 'text-sky-300', ring: 'ring-sky-500/30' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/30' },
  failed: { bg: 'bg-rose-500/10', text: 'text-rose-300', ring: 'ring-rose-500/30' },
  canceled: { bg: 'bg-gray-500/10', text: 'text-gray-300', ring: 'ring-gray-500/30' },
};

const formatDate = (d: string | number | Date, locale?: string) =>
    new Intl.DateTimeFormat(locale ?? undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d));

const formatAmount = (n: number | string, locale?: string) => {
  const val = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(val)) return String(n);
  return new Intl.NumberFormat(locale ?? undefined, { maximumFractionDigits: 8 }).format(val);
};

const SkeletonRow = () => (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
          <td key={i} className="px-4 py-3">
            <div className="h-4 w-full max-w-[12rem] rounded bg-white/10" />
          </td>
      ))}
    </tr>
);

const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent py-16 text-center">
      <div className="mb-2 text-lg font-semibold text-white/90">{title}</div>
      {subtitle ? <div className="max-w-md text-sm text-white/60">{subtitle}</div> : null}
    </div>
);

const Pill = ({ status }: { status: string }) => {
  const tone = statusTones[status?.toLowerCase()] ?? { bg: 'bg-white/10', text: 'text-white/80', ring: 'ring-white/10' };
  return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone.bg} ${tone.text} ring-1 ${tone.ring} capitalize`}>
      {status}
    </span>
  );
};

const SmartTabsTrigger = ({ value, children, icon: Icon, className = '' }: { value: TabKey; children: React.ReactNode; icon: any; className?: string }) => (
    <TabsTrigger
        value={value}
        className={`group relative overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-all data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:ring-white/20 data-[state=active]:bg-white/10 hover:text-white hover:ring-white/20 ${className}`}
    >
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 opacity-80" />
      {children}
    </span>
    </TabsTrigger>
);

const Transactions = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<TabKey>('in');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<BaseTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetcher =
        tab === 'in'
            ? getIncomingTransactions
            : tab === 'internal'
                ? getInternalTransactions
                : getOutgoingTransactions;
    setLoading(true);
    setError(null);
    fetcher(LIMIT, offset)
        .then(setItems)
        .catch((e: any) => setError(e?.message ?? 'Failed to load'))
        .finally(() => setLoading(false));
  }, [tab, offset]);

  const canPrev = offset > 0;
  const canNext = items.length === LIMIT;

  const locale = i18n.language;

  const table = useMemo(() => {
    if (error) {
      return <EmptyState title={t('common.error')} subtitle={error} />;
    }
    if (loading) {
      return (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
                <tr className="text-xs uppercase text-gray-400">
                  <th className="px-4 py-3">{t('transactions.id')}</th>
                  <th className="px-4 py-3">{t('transactions.asset')}</th>
                  <th className="px-4 py-3">{t('transactions.status')}</th>
                  <th className="px-4 py-3">{t('transactions.createdAt')}</th>
                  <th className="px-4 py-3">{t('transactions.updatedAt')}</th>
                  <th className="px-4 py-3 text-right">{t('transactions.amount')}</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
                </tbody>
              </table>
            </div>
          </div>
      );
    }
    if (!items.length) {
      return (
          <EmptyState
              title={t('transactions.noData')}
              subtitle={t('transactions.noDataHelp')}
          />
      );
    }

    return (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
                <tr className="text-xs uppercase text-gray-400">
                  <th className="px-4 py-3">{t('transactions.id')}</th>
                  <th className="px-4 py-3">{t('transactions.asset')}</th>
                  <th className="px-4 py-3">{t('transactions.status')}</th>
                  <th className="px-4 py-3">{t('transactions.createdAt')}</th>
                  <th className="px-4 py-3">{t('transactions.updatedAt')}</th>
                  <th className="px-4 py-3 text-right">{t('transactions.amount')}</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                {items.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-white/80 break-all">{tx.id}</td>
                      <td className="px-4 py-3">{tx.assetName}</td>
                      <td className="px-4 py-3"><Pill status={tx.status} /></td>
                      <td className="px-4 py-3 text-white/80">{formatDate(tx.createdAt, locale)}</td>
                      <td className="px-4 py-3 text-white/80">{formatDate(tx.updatedAt, locale)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatAmount(tx.amount as any, locale)}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {items.map((tx) => (
                <div key={tx.id} className="p-4 rounded-2xl border border-white/10 bg-gray-900/60 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-white/50">{t('transactions.id')}</div>
                      <div className="font-mono text-xs text-white/80 break-all">{tx.id}</div>
                    </div>
                    <Pill status={tx.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="text-white/60">{t('transactions.asset')}</div>
                    <div className="text-white/90 text-right">{tx.assetName}</div>
                    <div className="text-white/60">{t('transactions.createdAt')}</div>
                    <div className="text-white/90 text-right">{formatDate(tx.createdAt, locale)}</div>
                    <div className="text-white/60">{t('transactions.updatedAt')}</div>
                    <div className="text-white/90 text-right">{formatDate(tx.updatedAt, locale)}</div>
                    <div className="text-white/60">{t('transactions.amount')}</div>
                    <div className="text-white/90 text-right">{formatAmount(tx.amount as any, locale)}</div>
                  </div>
                </div>
            ))}
          </div>
        </>
    );
  }, [items, loading, error, locale, t]);

  const nextPage = () => {
    if (items.length === LIMIT) setOffset((o) => o + LIMIT);
  };
  const prevPage = () => setOffset((o) => Math.max(0, o - LIMIT));

  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="container mx-auto px-4 pt-24 pb-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('header.transactions')}</h1>
              <p className="mt-1 text-sm text-white/60">{t('transactions.subtitle')}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as TabKey);
                setOffset(0);
              }}
              className="w-full"
          >
            <TabsList className="mb-5 inline-flex flex-wrap gap-2 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10 backdrop-blur">
              <SmartTabsTrigger value="in" icon={ArrowDownRight} className="mr-2 md:mr-[10px] md:ml-[-4px]">
                {t('transactions.incoming')}
              </SmartTabsTrigger>
              <SmartTabsTrigger value="internal" icon={Shuffle} className="mr-2 md:mr-[10px]">
                {t('transactions.internal')}
              </SmartTabsTrigger>
              <SmartTabsTrigger value="out" icon={ArrowUpRight} className="md:mr-[-4px]">
                {t('transactions.outgoing')}
              </SmartTabsTrigger>
            </TabsList>


            <TabsContent value="in" className="mt-0 focus:outline-none">{table}</TabsContent>
            <TabsContent value="internal" className="mt-0 focus:outline-none">{table}</TabsContent>
            <TabsContent value="out" className="mt-0 focus:outline-none">{table}</TabsContent>
          </Tabs>

          {/* Pagination */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              {offset + 1}
              {' – '}
              {offset + (items.length ? items.length : 0)}
            </div>
            <div className="flex items-center gap-2">
              <button
                  onClick={prevPage}
                  disabled={!canPrev || loading}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:ring-white/20 disabled:opacity-50 disabled:hover:ring-white/10 bg-white/5"
              >
                {t('transactions.prev')}
              </button>
              <button
                  onClick={nextPage}
                  disabled={!canNext || loading}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:ring-white/20 disabled:opacity-50 disabled:hover:ring-white/10 bg-white/5"
              >
                {t('transactions.next')}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Transactions;
