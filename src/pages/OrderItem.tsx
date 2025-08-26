import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShieldCheck,
    Clock,
    ArrowLeftRight,
    ArrowDownUp,
    Copy,
    Store,
    UserRound,
    Star,
    ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getOrder, type OrderFull } from '@/api/orders';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';

// ===== shared countdown (как в OrderCard) =====
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

// ===== единый стиль статусов (как в OrderCard) =====
const STATUS_STYLES: Record<string, string> = {
    WAIT_PAYMENT: 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30',
    PAID: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
    DISPUTE: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
    CANCELED: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30',
    RELEASED: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    EXPIRED: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
};

export default function OrderItem({
                                      token,
                                      currentUserName,
                                  }: {
    token?: string;
    currentUserName: string;
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id = '' } = useParams();

    const [order, setOrder] = useState<OrderFull | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getOrder(id)
            .then((o) => {
                if (mounted) {
                    setOrder(o);
                    setError(null);
                }
            })
            .catch((e) => mounted && setError(String(e)))
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, [id]);

    const role: 'buyer' | 'seller' | undefined = useMemo(() => {
        if (!order) return undefined;
        if (order.buyer?.username === currentUserName) return 'buyer';
        if (order.seller?.username === currentUserName) return 'seller';
        return order.offer?.type === 'sell' ? 'seller' : 'buyer';
    }, [order, currentUserName]);

    const { minutes, seconds, isExpired } = useCountdown(order?.expiresAt);

    const BASE = order?.fromAsset?.name ?? order?.fromAssetID ?? '';
    const QUOTE = order?.toAsset?.name ?? order?.toAssetID ?? '';
    const pair = `${BASE}/${QUOTE}`;

    const paymentMethod =
        order?.clientPaymentMethod?.paymentMethod?.name ??
        order?.clientPaymentMethod?.name ??
        '';

    const statusClass = order
        ? STATUS_STYLES[order.status] ?? 'bg-white/10 text-white ring-1 ring-white/10'
        : '';

    const sideClass = role === 'buyer'
        ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
        : 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30';

    const priceNum = Number(order?.price);
    const amountNum = Number(order?.amount);
    const showTotal = Number.isFinite(priceNum) && Number.isFinite(amountNum);
    const totalQuote = showTotal ? priceNum * amountNum : null;

    const copyId = async () => {
        if (!order?.id) return;
        try { await navigator.clipboard.writeText(order.id); } catch {}
    };

    const goBackHref = '/orders';

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
            {/* Глобальная навигация как в списке */}
            <Header />

            <div className="container mx-auto px-4 pt-24 pb-8">
                {/* TOP BAR: Back + breadcrumbs + status/escrow/timer */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <Link
                            to={goBackHref}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('orderItem.back', 'Back to orders')}
                        </Link>
                        {order && (
                            <div className="hidden sm:flex items-center text-sm text-white/60 min-w-0">
                                <span className="mx-2">/</span>
                                <span className="truncate" title={pair}>{pair}</span>
                            </div>
                        )}
                    </div>

                    {order && (
                        <div className="inline-flex flex-wrap items-center gap-2">
              <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium capitalize', statusClass)}>
                {t(`orderStatus.${order.status}`, order.status)}
              </span>
                            {order.isEscrow && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-medium bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                                    {t('orderCard.escrow', 'Escrow')}
                </span>
                            )}
                            {role && (
                                <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium', sideClass)}>
                  {role === 'buyer' ? t('orderCard.youBuy', 'You buy') : t('orderCard.youSell', 'You sell')}
                </span>
                            )}
                            <div className="flex items-center gap-1 text-sm text-white/80">
                                <Clock className="w-4 h-4" />
                                {order.expiresAt ? (
                                    isExpired ? (
                                        <span className="text-rose-300">{t('orderCard.expired', 'Expired')}</span>
                                    ) : (
                                        <span>
                      {t('orderCard.expiresIn', 'Expires in')}{' '}
                                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                                    )
                                ) : (
                                    <span className="opacity-70">{t('orderCard.noExpiry', 'No expiry')}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading / Error */}
                {loading && (
                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">Loading…</div>
                )}
                {error && (
                    <div className="rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/30 p-6 text-rose-200">{error}</div>
                )}

                {order && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* LEFT: детали сделки и действия */}
                        <div className="lg:col-span-7 space-y-4">
                            {/* Counterparty + Pair banner (визуально дружит с OrderCard) */}
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Counterparty */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center font-bold">
                                            {(role === 'buyer' ? order.seller?.username : order.buyer?.username)?.charAt(0) ?? '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold tracking-tight truncate max-w-[28ch]" title={(role === 'buyer' ? order.seller?.username : order.buyer?.username) ?? ''}>
                                                    {(role === 'buyer' ? order.seller?.username : order.buyer?.username) ?? ''}
                                                </h4>
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10 text-white/70 inline-flex items-center gap-1">
                          {role === 'buyer' ? (
                              <UserRound className="w-3.5 h-3.5" />
                          ) : (
                              <Store className="w-3.5 h-3.5" />
                          )}
                                                    {role === 'buyer' ? t('orderCard.counterparty', 'Counterparty') : t('orderCard.offerOwner', 'Offer owner (you?)')}
                        </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                            {(role === 'buyer' ? order.seller?.rating : order.buyer?.rating) ?? 0}
                        </span>
                                                <span>•</span>
                                                <span>
                          {(role === 'buyer' ? order.seller?.ordersCount : order.buyer?.ordersCount) ?? 0} {t('offerCard.trades')}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pair + side */}
                                    <div className="hidden sm:flex items-center gap-3">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold tracking-tight">{BASE}</span>
                                            <span className="text-xl text-white/60">/</span>
                                            <span className="text-xl font-semibold text-white/90">{QUOTE}</span>
                                        </div>
                                        <div
                                            className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10',
                                                role === 'buyer' ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'
                                            )}
                                            title={role === 'buyer' ? (t('orderCard.youBuy', 'You buy') as string) : (t('orderCard.youSell', 'You sell') as string)}
                                        >
                                            {role === 'buyer' ? <ArrowDownUp className="w-3.5 h-3.5" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
                                            <span className="uppercase">{role}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Formula row */}
                                <div className="mt-3 flex items-center justify-between text-sm sm:text-base text-white/80">
                                    <div>
                                        <span className="font-medium">1 {BASE}</span>
                                        <span className="mx-2 opacity-70">≈</span>
                                        <span className="font-semibold">{order.price} {QUOTE}</span>
                                    </div>
                                    <div className="text-xs text-white/60">
                                        {t('orderCard.created')}: {new Date(order.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Key stats */}
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                                <div className="grid grid-cols-12 items-start gap-3">
                                    <div className="col-span-6 sm:col-span-3">
                                        <p className="text-[11px] text-white/60">{t('offerCard.amount')} ({BASE})</p>
                                        <p className="text-xl leading-tight font-semibold">{order.amount}</p>
                                        {role && (
                                            <p className="text-xs text-white/50">{t('orderCard.role')}: {t(`orderCard.${role}`, role)}</p>
                                        )}
                                    </div>

                                    <div className="col-span-6 sm:col-span-3">
                                        <p className="text-[11px] text-white/60">{t('offerCard.price')} ({QUOTE})</p>
                                        <p className="text-lg leading-tight font-semibold">{order.price}</p>
                                        {showTotal && (
                                            <p className="text-xs text-white/50">{t('orderCard.total')}: {totalQuote!.toLocaleString()} {QUOTE}</p>
                                        )}
                                    </div>

                                    <div className="col-span-12 sm:col-span-3">
                                        <p className="text-[11px] text-white/60">{t('offerCard.paymentMethods')}</p>
                                        <p className="text-sm text-white/80 truncate" title={paymentMethod || t('orderCard.notSpecified', 'Not specified')}>
                                            {paymentMethod || t('orderCard.notSpecified', 'Not specified')}
                                        </p>
                                        <p className="mt-1 text-xs text-white/60">
                                            {t('orderCard.status', 'Status')}: <span className={cn('font-medium px-1.5 py-0.5 rounded-md', statusClass)}>{t(`orderStatus.${order.status}`, order.status)}</span>
                                        </p>
                                    </div>

                                    {/* UUID + copy */}
                                    <div className="col-span-12 sm:col-span-3">
                                        <p className="text-[11px] text-white/60">{t('offerCard.id')}</p>
                                        <div className="flex items-center gap-2">
                                            <code className="font-mono text-xs break-all">{order.id}</code>
                                            <button
                                                type="button"
                                                onClick={copyId}
                                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                                                title={t('common.copy', 'Copy') as string}
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions / compliance block */}
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm opacity-70">{t('orderItem.instructions', 'Instructions')}</div>
                                    <div className="flex items-center gap-2 text-xs text-white/60">
                                        <Clock className="w-4 h-4" />
                                        {order.expiresAt ? (
                                            isExpired ? (
                                                <span className="text-rose-300">{t('orderCard.expired', 'Expired')}</span>
                                            ) : (
                                                <span>
                          {t('orderCard.expiresIn', 'Expires in')}{' '}
                                                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                                            )
                                        ) : (
                                            <span className="opacity-70">{t('orderCard.noExpiry', 'No expiry')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-white/90">
                                    {t('orderItem.placeholder', 'Payment and delivery details go here.')}
                                </div>

                                {/* Action buttons (UX стандарты p2p): просто UI-слой, без логики */}
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {/* Примерные действия: отметка оплаты / отмена / открытие диспута */}
                                    <button
                                        type="button"
                                        disabled={order.status !== 'WAIT_PAYMENT'}
                                        className={cn(
                                            'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium ring-1 ring-white/10 transition',
                                            order.status === 'WAIT_PAYMENT' ? 'bg-emerald-500/20 hover:bg-emerald-500/25' : 'bg-white/5 text-white/60 cursor-not-allowed'
                                        )}
                                        title={t('orderItem.markAsPaid', 'Mark as paid') as string}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {t('orderItem.markAsPaid', 'Mark as paid')}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={order.status === 'CANCELED' || order.status === 'RELEASED' || order.status === 'EXPIRED'}
                                        className={cn(
                                            'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium ring-1 ring-white/10 transition',
                                            order.status === 'CANCELED' || order.status === 'RELEASED' || order.status === 'EXPIRED'
                                                ? 'bg-white/5 text-white/60 cursor-not-allowed'
                                                : 'bg-rose-500/20 hover:bg-rose-500/25'
                                        )}
                                        title={t('orderItem.cancelOrder', 'Cancel order') as string}
                                    >
                                        {t('orderItem.cancelOrder', 'Cancel order')}
                                    </button>

                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                                        title={t('orderItem.openDispute', 'Open dispute') as string}
                                    >
                                        {t('orderItem.openDispute', 'Open dispute')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: чат */}
                        <div className="lg:col-span-5">
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 lg:p-4 h-full">
                                <ChatPanel orderId={order.id} token={token} currentUserName={currentUserName} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky mobile CTA bar (p2p стандарт UX) */}
            {order && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70 p-3 sm:hidden">
                    <div className="container mx-auto px-1 flex items-center justify-between gap-2">
                        <div className="text-xs text-white/70">
                            <div className="font-medium">{pair}</div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {order.expiresAt ? (
                                    isExpired ? (
                                        <span className="text-rose-300">{t('orderCard.expired', 'Expired')}</span>
                                    ) : (
                                        <span>
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                                    )
                                ) : (
                                    <span className="opacity-70">{t('orderCard.noExpiry', 'No expiry')}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate(`/orders/${order.id}`, { state: { background: location } })}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/10 bg-emerald-500/20 hover:bg-emerald-500/25 transition"
                            >
                                {t('orderCard.open', 'Open order')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(goBackHref)}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}