import { Star, Pencil, PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OfferCardProps {
  order: {
    id: string;
    trader: {
      name: string;
      rating: number;
      completedTrades: number;
      online: boolean;
    };
    fromAsset: { name: string };
    toAsset: { name: string };
    amount: string;
    price: string;
    paymentMethods: string[];
    limits: { min: string; max: string };
    type: 'buy' | 'sell';
    isEnabled?: boolean;
    conditions?: string;
    orderExpirationTimeout?: number;
    TTL?: string;
  };
  isClientOffer?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

export const OfferCard = ({ order, isClientOffer, onToggle, onEdit }: OfferCardProps) => {
  const { t } = useTranslation();
  const {
    trader,
    fromAsset,
    toAsset,
    amount,
    price,
    paymentMethods,
    limits,
    type,
    isEnabled,
    conditions,
    orderExpirationTimeout,
    TTL,
  } = order;

  const currency = `${fromAsset?.name}/${toAsset?.name}`;

  return (
      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-0  transition hover:border-white/20 hover:bg-gray-900/70 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 gap-6">
          {/* Trader Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center font-bold">
                {trader.name.charAt(0)}
              </div>
              <span
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                      trader.online ? 'bg-green-500' : 'bg-gray-500'
                  }`}
              />
            </div>
            <div>
              <h4 className="font-semibold text-white tracking-tight">{trader.name}</h4>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{trader.rating}</span>
                </div>
                <span>•</span>
                <span>{trader.completedTrades} {t('offerCard.trades')}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="flex-1 lg:mx-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-white/60">{t('offerCard.currency')}</p>
                <p className="font-medium">{currency}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">{t('offerCard.amount')}</p>
                <p className="font-medium">{amount}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">{t('offerCard.price')}</p>
                <p className="font-medium">{price}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">{t('offerCard.limits')}</p>
                <p className="font-medium">{limits.min} - {limits.max}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-white/60 mb-2">{t('offerCard.paymentMethods')}</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method, index) => (
                    <span
                        key={index}
                        className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs ring-1 ring-white/10"
                    >
                  {method}
                </span>
                ))}
              </div>
            </div>
            {(conditions || TTL || orderExpirationTimeout || typeof isEnabled === 'boolean') && (
              <div className="mt-3 space-y-1">
                {conditions && (
                  <p className="text-sm text-gray-400">{t('offerCard.conditions')}: {conditions}</p>
                )}
                {(TTL || orderExpirationTimeout) && (() => {
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  const format = (d: Date) => `${pad(d.getHours())}.${pad(d.getMinutes())} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear() % 100)}`;
                  const exp = TTL ? new Date(TTL) : new Date(Date.now() + (orderExpirationTimeout ?? 0) * 1000);
                  return (
                    <p className="text-sm text-gray-400">
                      {t('offerCard.expiration')}: {format(exp)}
                    </p>
                  );
                })()}
                {typeof isEnabled === 'boolean' && (
                  <p className="text-sm text-gray-400">
                    {t('offerCard.status')}: {isEnabled ? t('offerCard.active') : t('offerCard.inactive')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isClientOffer ? (
                <>
                  <button
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition"
                      onClick={onEdit}
                  >
                    <Pencil className="w-4 h-4" /> {t('offerCard.edit')}
                  </button>
                  <button
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                          isEnabled
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                      }`}
                      onClick={onToggle}
                  >
                    <PowerOff className="w-4 h-4" /> {isEnabled ? t('offerCard.disable') : t('offerCard.enable')}
                  </button>
                </>
            ) : (
                <>
                  <button
                      className={`px-6 py-2 rounded-xl font-medium text-sm transition ${
                          type === 'buy'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {type === 'buy' ? t('offerCard.sell') : t('offerCard.buy')}
                  </button>
                </>
            )}
          </div>
        </div>
      </div>
  );
};
