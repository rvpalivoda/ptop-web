import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getClientAssets, createWallet, ClientAsset } from '@/api';
import { Copy, Check, Wallet } from 'lucide-react';

const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-gray-900/60 p-4">
      <div className="h-5 w-40 rounded bg-white/10" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="h-4 w-24 justify-self-end rounded bg-white/10" />
        <div className="col-span-2 h-9 rounded bg-white/10" />
      </div>
    </div>
);

const formatAmount = (n: number | string, locale?: string) => {
  const val = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(val)) return String(n);
  return new Intl.NumberFormat(locale ?? undefined, {
    maximumFractionDigits: 8,
  }).format(val);
};

const Balance = () => {
  const { t, i18n } = useTranslation();
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClientAssets()
        .then(setAssets)
        .catch((e: any) => setError(e?.message ?? 'Failed to load'))
        .finally(() => setLoading(false));
  }, []);

  const handleCreateWallet = async (assetId: string) => {
    try {
      setCreatingId(assetId);
      const wallet = await createWallet(assetId);
      setAssets(prev => prev.map(b => (b.id === assetId ? { ...b, value: wallet.value } : b)));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create wallet');
    } finally {
      setCreatingId(null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const locale = i18n.language;

  const content = useMemo(() => {
    if (error && !loading) {
      return (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-200">
            {t('common.error')}: {error}
          </div>
      );
    }

    if (loading) {
      return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
          </div>
      );
    }

    if (!assets.length) {
      return (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="text-lg font-semibold text-white/90">{t('balance.noAssets')}</div>
            <div className="mt-1 text-sm text-white/60">{t('balance.noAssetsHelp')}</div>
          </div>
      );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((b) => (
              <div
                  key={b.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 p-4 shadow-sm transition hover:border-white/20 hover:bg-gray-900/70"
              >
                {/* Top row: name + icon */}
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold tracking-tight">{b.name}</div>
                  <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
                    <Wallet className="h-4 w-4 opacity-80" />
                  </div>
                </div>

                {/* Amounts */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="text-white/60">{t('balance.amount')}</div>
                  <div className="text-right font-medium">{formatAmount((b as any).amount, locale)}</div>
                  {'amountEscrow' in b && (
                      <>
                        <div className="text-white/60">{t('balance.amountEscrow')}</div>
                        <div className="text-right">{formatAmount((b as any).amountEscrow, locale)}</div>
                      </>
                  )}
                </div>

                {/* Address or CTA */}
                <div className="mt-4">
                  {b.value ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/60">{t('balance.address')}</span>
                        <span className="font-mono text-[13px] break-all leading-5 text-white/90">
                    {b.value}
                  </span>
                        <button
                            onClick={() => handleCopy(b.value!, b.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs font-medium ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20"
                            aria-label={t('common.copy') as string}
                        >
                          {copiedId === b.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === b.id ? t('common.copied') : t('common.copy')}
                        </button>
                      </div>
                  ) : (
                      <button
                          onClick={() => handleCreateWallet(b.id)}
                          disabled={creatingId === b.id}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 disabled:opacity-60"
                      >
                        <Wallet className="h-4 w-4" />
                        {creatingId === b.id ? t('balance.creating') : t('balance.getAddress')}
                      </button>
                  )}
                </div>

                {/* Description */}
                {(b as any).description ? (
                    <div className="mt-3 text-sm leading-snug text-white/70">{(b as any).description}</div>
                ) : null}
              </div>
          ))}
        </div>
    );
  }, [assets, loading, error, copiedId, creatingId, t, locale]);

  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="container mx-auto px-3 pt-16 md:pt-24 pb-24 md:pb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('header.balance')}</h1>
          <p className="mt-1 mb-5 text-sm text-white/60">{t('balance.subtitle')}</p>
          {content}
        </div>
      </div>
  );
};

export default Balance;
