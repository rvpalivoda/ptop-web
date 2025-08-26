import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Clock, ArrowLeftRight, Star, ExternalLink, Store, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrderFull } from '@/api/orders';
import { cn } from '@/lib/utils';

type Props = {
  order: OrderFull;
  currentUserID: string;
  onOpen?: (order: OrderFull) => void;
};

type Kind = 'my-deal' | 'ad-deal';
type Role = 'buyer' | 'seller';

const STATUS_STYLES: Record<string, string> = {
  WAIT_PAYMENT: 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30',
  PAID: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
  DISPUTE: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
  CANCELED: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30',
  RELEASED: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
  EXPIRED: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
};

function useCountdown(expiresAt?: string | null) {
  const [left, setLeft] = useState<number>(() => {
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(left / 1000 / 60);
  const seconds = Math.floor((left / 1000) % 60);
  const isExpired = left <= 0;

  return { minutes, seconds, isExpired, ms: left };
}

export function OrderCard({ order, currentUserID, onOpen }: Props) {
  const { t } = useTranslation();

  const {
    id,
    offer,
    offerOwner,
    buyer,
    seller,
    authorID,
    offerOwnerID,
    buyerID,
    sellerID,
    fromAsset,
    toAsset,
    fromAssetID,
    toAssetID,
    amount,
    price,
    clientPaymentMethod,
    status,
    isEscrow,
    expiresAt,
    createdAt,
  } = order;

  const { kind, role } = useMemo(() => {
    const isMyDeal: boolean = currentUserID === offerOwnerID;
    const isAdDeal: boolean = currentUserID === authorID && currentUserID !== offerOwnerID;

    const role: Role =
      currentUserID === buyerID ? 'buyer'
      : currentUserID === sellerID ? 'seller'
      : offer?.type === 'sell' ? 'seller' : 'buyer';

    const kind: Kind = isMyDeal ? 'my-deal' : 'ad-deal';
    return { kind, role };
  }, [authorID, buyerID, currentUserID, offer?.type, offerOwnerID, sellerID]);

  const counterparty = role === 'buyer' ? seller : buyer;

  const currency = `${fromAsset?.name ?? fromAssetID}/${toAsset?.name ?? toAssetID}`;
  const paymentMethod =
    clientPaymentMethod?.paymentMethod?.name ??
    clientPaymentMethod?.name ??
    '';

  const kindLabel = kind === 'my-deal' ? t('orderCard.fromMyAds', 'From my ads') : t('orderCard.iInitiated', 'I initiated');
  const youAction = role === 'buyer'
    ? t('orderCard.youBuy', 'You buy')
    : t('orderCard.youSell', 'You sell');

  const { minutes, seconds, isExpired } = useCountdown(expiresAt);

  const statusClass = STATUS_STYLES[status] ?? 'bg-white/10 text-white ring-1 ring-white/10';

  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-0 transition hover:border-white/20 hover:bg-gray-900/70 text-white shadow-lg">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <span
              className={cn(
                'px-2.5 py-1 text-xs rounded-full font-medium',
                kind === 'my-deal'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
              )}
              title={kind === 'my-deal' ? 'Order for my offer' : 'Order I created'}
            >
              {kindLabel}
            </span>

            <span className={cn('px-2.5 py-1 text-xs rounded-full font-medium capitalize', statusClass)}>
              {t(`orderStatus.${status}`, status)}
            </span>

            {isEscrow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('orderCard.escrow', 'Escrow')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/70">
          <Clock className="w-4 h-4" />
          {expiresAt ? (
            isExpired ? (
              <span className="text-rose-300">{t('orderCard.expired', 'Expired')}</span>
            ) : (
              <span>
                {t('orderCard.expiresIn', 'Expires in')} {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            )
          ) : (
            <span className="opacity-70">{t('orderCard.noExpiry', 'No expiry')}</span>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 lg:px-6">
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center font-bold">
              {(counterparty?.username ?? '?').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold tracking-tight">{counterparty?.username ?? ''}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10 text-white/70 inline-flex items-center gap-1">
                  {kind === 'my-deal' ? (
                    <>
                      <Store className="w-3.5 h-3.5" />
                      {t('orderCard.offerOwner', 'Offer owner (you)')}
                    </>
                  ) : (
                    <>
                      <UserRound className="w-3.5 h-3.5" />
                      {t('orderCard.counterparty', 'Counterparty')}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{counterparty?.rating ?? 0}</span>
                </div>
                <span>•</span>
                <span>{counterparty?.ordersCount ?? 0} {t('offerCard.trades')}</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-white/80">
            <ArrowLeftRight className="w-4 h-4" />
            <div className="text-right">
              <div className="text-xs text-white/60">{youAction}</div>
              <div className="font-medium">{currency}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="font-medium">{paymentMethod || t('orderCard.notSpecified', 'Not specified')}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-white/60">{t('orderCard.role')}</p>
            <p className="font-medium capitalize">{t(`orderCard.${role}`, role)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">{t('orderCard.created')}</p>
            <p className="font-medium">{new Date(createdAt).toLocaleString()}</p>
          </div>
          <div className="col-span-2 lg:col-span-2">
            <p className="text-xs text-white/60">{t('offerCard.id')}</p>
            <p className="font-medium break-all">{id}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-xs text-white/50">
            {kind === 'my-deal'
              ? t('orderCard.tipMyDeal', 'This order was created on your offer.')
              : t('orderCard.tipAdDeal', 'You created this order on someone else’s offer.')}
          </div>
          <button
            type="button"
            onClick={() => onOpen?.(order)}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <ExternalLink className="w-4 h-4" />
            {t('orderCard.open', 'Open order')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
