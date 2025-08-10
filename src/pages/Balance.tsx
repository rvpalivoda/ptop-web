import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';
import { getClientAssets, createWallet, ClientAsset } from '@/api';

const Balance = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    getClientAssets()
        .then(setAssets)
        .finally(() => setLoading(false));
  }, []);

  const handleCreateWallet = async (assetId: string) => {
    const wallet = await createWallet(assetId);
    setAssets(prev =>
        prev.map(b => (b.id === assetId ? { ...b, value: wallet.value } : b)),
    );
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <h1 className="text-2xl font-bold mb-4">{t('header.balance')}</h1>

          {loading ? (
              <p>{t('balance.loading')}</p>
          ) : (
              <div className="space-y-4">
                {assets.map((b) => (
                    <div
                        key={b.id}
                        className="p-4 bg-gray-800/80 rounded-xl ring-1 ring-white/5"
                    >
                      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-12 sm:items-center">
                        {/* name + amount */}
                        <div className="sm:col-span-7 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <div className="font-semibold text-base">{b.name}</div>
                          <div className="text-sm text-gray-400">
                            <span className="text-xs">{t('balance.amount')}:{' '}</span>
                            <span className="text-gray-200">{b.amount}</span>
                          </div>
                        </div>

                        {/* value / кнопка */}
                        <div className="sm:col-span-5 sm:justify-self-end">
                          {b.value ? (
                              <div className="flex flex-wrap items-center gap-2 break-all">
                        <span className="text-xs text-gray-400">
                          {t('balance.address')}
                        </span>
                                <span className="font-mono text-sm">
                          {b.value}
                        </span>
                                <button
                                    onClick={() => handleCopy(b.value!, b.id)}
                                    className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                                >
                                  {copiedId === b.id ? t('common.copied') : t('common.copy')}
                                </button>
                              </div>
                          ) : (
                              <button
                                  onClick={() => handleCreateWallet(b.id)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm"
                              >
                                {t('balance.getAddress')}
                              </button>
                          )}
                        </div>

                        {/* description */}
                        {(b as any).description ? (
                            <div className="sm:col-span-12 mt-1 text-sm text-gray-300 leading-snug">
                              {(b as any).description}
                            </div>
                        ) : null}
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
};

export default Balance;
