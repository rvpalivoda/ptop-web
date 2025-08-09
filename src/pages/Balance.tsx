import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';
import { getClientAssets, createWallet, ClientAsset } from '@/api';

const Balance = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(true);

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
                className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-gray-400">{b.amount}</div>
                  {b.value && (
                    <div className="text-sm break-all mt-1">{b.value}</div>
                  )}
                </div>
                {!b.value && (
                  <button
                    onClick={() => handleCreateWallet(b.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                  >
                    {t('balance.getAddress')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Balance;
