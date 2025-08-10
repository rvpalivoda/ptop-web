import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';
import { getClientOffers, Offer } from '@/api/offers';

const Adverts = () => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getClientOffers();
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setOffers(sorted);
      } catch (err) {
        console.error('load client offers error:', err);
        if (!cancelled) setOffers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.adverts')}</h1>
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li key={offer.id} data-testid="client-offer">
              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-400">
                  {offer.fromAssetID} → {offer.toAssetID}
                </div>
                <div className="font-semibold">
                  {offer.amount} @ {offer.price}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Adverts;
