import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  ArrowLeftRight,
  ArrowDownUp,
  Star,
  ExternalLink,
  Store,
  UserRound,
  Copy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrderFull } from '@/api/orders';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

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
  CANCELLED: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30',
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
  const navigate = useNavigate();
  const location = useLocation();
  const {
    id,
    offer,
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
    const role: Role =
        currentUserID === buyerID ? 'buyer'
            : currentUserID === sellerID ? 'seller'
                : offer?.type === 'sell' ? 'seller' : 'buyer';
    const kind: Kind = isMyDeal ? 'my-deal' : 'ad-deal';
    return { kind, role };
  }, [authorID, buyerID, currentUserID, offer?.type, offerOwnerID, sellerID]);

  const counterparty = role === 'buyer' ? seller : buyer;

  // BASE/QUOTE + пара
  const BASE = fromAsset?.name ?? fromAssetID ?? '';
  const QUOTE = toAsset?.name ?? toAssetID ?? '';
  const pair = `${BASE}/${QUOTE}`;

  const paymentMethod =
      clientPaymentMethod?.paymentMethod?.name ??
      clientPaymentMethod?.name ??
      '';

  const kindLabel = kind === 'my-deal'
      ? t('orderCard.fromMyAds')
      : t('orderCard.iInitiated');

  const youAction = role === 'buyer'
      ? t('orderCard.youBuy')
      : t('orderCard.youSell');

  const { minutes, seconds, isExpired } = useCountdown(expiresAt);
  const statusClass = STATUS_STYLES[status] ?? 'bg-white/10 text-white ring-1 ring-white/10';

  // Цвет стороны сделки (сохраняем принятый ранее маппинг: buy=red, sell=green)
  const sideClass =
      role === 'buyer'
          ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
          : 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30';

  // Подсчёт total (если amount/price числовые)
  const priceNum = Number(price);
  const amountNum = Number(amount);
  const showTotal = Number.isFinite(priceNum) && Number.isFinite(amountNum);
  const totalQuote = showTotal ? (priceNum * amountNum) : null;

  const copyId = async () => {
    try { await navigator.clipboard.writeText(id); } catch {}
  };

  const handleOpen = () => {
    if (onOpen) return onOpen(order);
    // откроем как страницу (можно и как route-modal, если используешь background)
    navigate(`/orders/${id}`, { state: { background: location } });
  };


  return (
      <div className="rounded-xl border border-white/10 bg-gray-900/70 p-0 transition hover:border-white/20 hover:bg-gray-900/80 text-white shadow-lg">
        {/* HEADER: бейджи/эскроу | таймер */}
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-3">
          <div className="inline-flex items-center gap-2">
          <span
              className={cn(
                  'px-2 py-0.5 text-[11px] rounded-full font-medium',
                  kind === 'my-deal'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
              )}
              title={kind === 'my-deal' ? 'Order for my offer' : 'Order I created'}
          >
            {kindLabel}
          </span>

            <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium capitalize', statusClass)}>
            {t(`orderStatus.${status}`, status)}
          </span>

            {isEscrow && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-medium bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
                  {t('orderCard.escrow')}
            </span>
            )}

            {/* Ваша сторона сделки как бейдж */}
            <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium', sideClass)}>
            {youAction}
          </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock className="w-4 h-4" />
            {expiresAt ? (
                isExpired ? (
                    <span className="text-rose-300">{t('orderCard.expired')}</span>
                ) : (
                    <span>
                {t('orderCard.expiresIn')}{' '}
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
                )
            ) : (
                <span className="opacity-70">{t('orderCard.noExpiry')}</span>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 lg:px-3">
          {/* COUNTERPARTY (компактно) */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center font-bold">
                {(counterparty?.username ?? '?').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold tracking-tight truncate">{counterparty?.username ?? ''}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10 text-white/70 inline-flex items-center gap-1">
                  {kind === 'my-deal' ? (
                      <>
                        <Store className="w-3.5 h-3.5" />
                        {t('orderCard.offerOwner')}
                      </>
                  ) : (
                      <>
                        <UserRound className="w-3.5 h-3.5" />
                        {t('orderCard.counterparty')}
                      </>
                  )}
                </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  {counterparty?.rating ?? 0}
                </span>
                  <span>•</span>
                  <span>{counterparty?.ordersCount ?? 0} {t('offerCard.trades')}</span>
                </div>
              </div>
            </div>

            {/* Пара справа на lg (дублируется баннером ниже) */}
            <div className="hidden lg:flex items-center gap-2 text-white/80">
              <ArrowLeftRight className="w-4 h-4" />
              <div className="text-right">
                <div className="text-xs text-white/60">{youAction}</div>
                <div className="font-medium">{pair}</div>
              </div>
            </div>
          </div>

          {/* PAIR BANNER — крупная пара и формула */}
          <div className="mt-3 w-full rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2 flex items-center gap-2">
            {/* Pair ticker */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg md:text-2xl font-bold tracking-tight">{BASE}</span>
              <span className="text-base md:text-xl text-white/60">/</span>
              <span className="text-base md:text-xl font-semibold text-white/90">{QUOTE}</span>
            </div>

            {/* Direction pill by YOUR role */}
            <div
                className={cn(
                    'ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] md:text-xs ring-1 ring-white/10',
                    role === 'buyer' ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'
                )}
                title={youAction as string}
            >
              {role === 'buyer' ? <ArrowDownUp className="w-3.5 h-3.5" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
              <span className="uppercase">{role}</span>
            </div>

            {/* Formula */}
            <div className="ml-auto text-right text-xs md:text-sm text-white/80">
              <span className="font-medium whitespace-nowrap">1 {BASE}</span>
              <span className="mx-1 md:mx-2 opacity-70">≈</span>
              <span className="font-semibold whitespace-nowrap">{price} {QUOTE}</span>
            </div>
          </div>

          {/* STATS — крупные числа, минимум воздуха */}
          <div className="mt-3 grid grid-cols-12 items-start gap-3">
            <div className="col-span-6 sm:col-span-3">
              <p className="text-[11px] text-white/60">{t('offerCard.amount')} ({BASE})</p>
              <p className="text-xl leading-tight font-semibold">{amount}</p>
              <p className="text-xs text-white/50">{t('orderCard.role')}: {t(`orderCard.${role}`, role)}</p>
            </div>

            <div className="col-span-6 sm:col-span-3">
              <p className="text-[11px] text-white/60">{t('offerCard.price')} ({QUOTE})</p>
              <p className="text-lg leading-tight font-semibold">{price}</p>
              <p className="text-xs text-white/50">{t('orderCard.created')}: {new Date(createdAt).toLocaleString()}</p>
            </div>

            <div className="col-span-12 sm:col-span-3">
              <p className="text-[11px] text-white/60">{t('offerCard.paymentMethods')}</p>
              <p className="text-sm text-white/80 truncate" title={paymentMethod || t('orderCard.notSpecified')}>
                {paymentMethod || t('orderCard.notSpecified')}
              </p>
              {showTotal && (
                  <p className="mt-1 text-xs text-white/60">
                    {t('orderCard.total')}: <span className="text-white/80 font-medium">
                  {totalQuote!.toLocaleString()} {QUOTE}
                </span>
                  </p>
              )}
            </div>

            {/* UUID с копированием */}
            <div className="col-span-12 sm:col-span-3">
              <p className="text-[11px] text-white/60">{t('offerCard.id')}</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs break-all">{id}</code>
                <button
                    type="button"
                    onClick={copyId}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                    title={t('common.copy') as string}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER: tip + open (mobile-friendly) */}
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="text-xs text-white/50 order-2 sm:order-1">
              {kind === 'my-deal'
                  ? t('orderCard.tipMyDeal')
                  : t('orderCard.tipAdDeal')}
            </div>
            <button
                type="button"
                onClick={handleOpen}
                className="order-1 sm:order-2 inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              {t('orderCard.open')}
            </button>
          </div>
        </div>
      </div>
  );
}

export default OrderCard;
