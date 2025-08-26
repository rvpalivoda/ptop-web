import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getOrder, type OrderFull } from '@/api/orders';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { cn } from '@/lib/utils';


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
    return { minutes, seconds, isExpired };
}

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
    const statusClass =
        order ? STATUS_STYLES[order.status] ?? 'bg-white/10 text-white ring-1 ring-white/10' : '';

    return (
        <div className="mx-auto w-full max-w-6xl px-3 py-4 text-white">
            <div className="mb-3 flex items-center justify-between">
                <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('orderItem.back', 'Back to orders')}
                </Link>

                {order && (
                    <div className="inline-flex items-center gap-2">
            <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium capitalize', statusClass)}>
              {t(`orderStatus.${order.status}`, order.status)}
            </span>
                        {order.isEscrow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-medium bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                                {t('orderCard.escrow', 'Escrow')}
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

            {loading && (
                <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">Loading…</div>
            )}
            {error && (
                <div className="rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/30 p-6 text-rose-200">
                    {error}
                </div>
            )}
            {order && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* LEFT: order details */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm opacity-70">{t('orderItem.pair', 'Pair')}</div>
                                    <div className="text-2xl font-semibold">{pair}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm opacity-70">{t('offerCard.price')}</div>
                                    <div className="text-xl font-semibold">
                                        {order.price} {QUOTE}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <div className="text-[11px] opacity-70">{t('offerCard.amount')}</div>
                                    <div className="font-medium">{order.amount} {BASE}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] opacity-70">{t('orderCard.total')}</div>
                                    <div className="font-medium">
                                        {(Number(order.price) * Number(order.amount) || 0).toLocaleString()} {QUOTE}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] opacity-70">{t('orderCard.role')}</div>
                                    <div className="font-medium capitalize">{role}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] opacity-70">{t('offerCard.paymentMethods')}</div>
                                    <div className="font-medium">
                                        {order.clientPaymentMethod?.paymentMethod?.name ??
                                            order.clientPaymentMethod?.name ??
                                            t('orderCard.notSpecified', 'Not specified')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* тут могут быть инструкции/таймер/кнопки подтверждений и т.д. */}
                        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                            <div className="text-sm opacity-70 mb-2">{t('orderItem.instructions', 'Instructions')}</div>
                            <div className="text-white/90">
                                {/* Вставь детали оплаты/инструкции сюда */}
                                {t('orderItem.placeholder', 'Payment and delivery details go here.')}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Chat */}
                    <div className="lg:col-span-5">
                        <ChatPanel orderId={order.id} token={token} currentUserName={currentUserName} />
                    </div>
                </div>
            )}
        </div>
    );
}
