import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrderFull } from '@/api/orders';

interface OrderCardProps {
  order: OrderFull;
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const { t } = useTranslation();
  const {
    id,
    offerOwner,
    fromAsset,
    toAsset,
    fromAssetID,
    toAssetID,
    amount,
    price,
    clientPaymentMethod,
    status,
    createdAt,
  } = order;

  const currency = `${fromAsset?.name ?? fromAssetID}/${toAsset?.name ?? toAssetID}`;
  const paymentMethod =
    clientPaymentMethod?.paymentMethod?.name ??
    clientPaymentMethod?.name ??
    '';

  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-0  transition hover:border-white/20 hover:bg-gray-900/70 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-5 gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center font-bold">
              {offerOwner?.username?.charAt(0) ?? '?'}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white tracking-tight">{offerOwner?.username ?? ''}</h4>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{offerOwner?.rating ?? 0}</span>
              </div>
              <span>•</span>
              <span>{offerOwner?.ordersCount ?? 0} {t('offerCard.trades')}</span>
            </div>
          </div>
        </div>

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
              <p className="text-xs text-white/60">{t('offerCard.paymentMethods')}</p>
              <p className="font-medium">{paymentMethod}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-white/60">{t('orderCard.status')}</p>
              <p className="font-medium">{t(`orderStatus.${status}`)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('orderCard.created')}</p>
              <p className="font-medium">{new Date(createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('offerCard.id')}</p>
              <p className="font-medium break-all">{id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
