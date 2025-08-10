import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';
import {
  getClientOffers,
  Offer,
  enableOffer,
  disableOffer,
} from '@/api/offers';
import type { ClientPaymentMethod } from '@/api/clientPaymentMethods';
import { OfferCard } from '@/components/OfferCard';
import { CreateOfferForm } from '@/components/CreateOfferForm';

const Adverts = () => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [editing, setEditing] = useState<Offer | null>(null);

  const loadOffers = async () => {
    try {
      const data = await getClientOffers();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setOffers(sorted);
    } catch (err) {
      console.error('load client offers error:', err);
      setOffers([]);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const toggleOffer = async (offer: Offer) => {
    try {
      const updated = offer.isEnabled
        ? await disableOffer(offer.id)
        : await enableOffer(offer.id);
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, ...updated } : o)),
      );
    } catch (err) {
      console.error('toggle offer error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.adverts')}</h1>
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li key={offer.id} data-testid="client-offer">
              <OfferCard
                order={{
                  id: offer.id,
                  trader: {
                    name: 'Вы',
                    rating: 0,
                    completedTrades: 0,
                    online: true,
                  },
                  fromAsset: { name: offer.fromAsset?.name || offer.fromAssetID },
                  toAsset: { name: offer.toAsset?.name || offer.toAssetID },
                  amount: String(offer.amount),
                  price: String(offer.price),
                  paymentMethods:
                    offer.clientPaymentMethods?.map(
                      (m: ClientPaymentMethod) =>
                        m.paymentMethod?.name ?? m.name ?? '',
                    )
                      .filter(Boolean) ?? [],
                  limits: {
                    min: String(offer.minAmount),
                    max: String(offer.maxAmount),
                  },
                  type: (offer.type ?? 'buy') as 'buy' | 'sell',
                  isEnabled: offer.isEnabled,
                  conditions: offer.conditions,
                  orderExpirationTimeout: offer.orderExpirationTimeout,
                  TTL: offer.TTL,
                }}
                isClientOffer
                onToggle={() => toggleOffer(offer)}
                onEdit={() => setEditing(offer)}
              />
            </li>
          ))}
        </ul>
        {editing && (
          <CreateOfferForm
            offer={editing}
            onClose={() => {
              setEditing(null);
              loadOffers();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Adverts;
