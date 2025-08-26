import { useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowDownUp, Clock, Star, Pencil, PowerOff, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CreateOrderForm } from './CreateOrderForm';
import { useAuth } from '@/context';
import type { ClientPaymentMethod } from '@/api/clientPaymentMethods';
import { cn } from '@/lib/utils';

interface OfferCardProps {
    offer: {
        id: string;
        trader: { name: string; rating: number; completedTrades: number; online: boolean };
        fromAsset: { name: string }; // BASE
        toAsset: { name: string };   // QUOTE (фиат/крипта)
        amount: string;
        price: string;               // за 1 BASE в QUOTE
        paymentMethods: ClientPaymentMethod[];
        limits: { min: string; max: string }; // в QUOTE
        type: 'buy' | 'sell';        // сторона трейдера: buy — он покупает BASE за QUOTE
        isEnabled?: boolean;
        conditions?: string;
        offerExpirationTimeout?: number;
        TTL?: string;
    };
    isClientOffer?: boolean;
    onToggle?: () => void;
    onEdit?: () => void;
}

export const OfferCard = ({ offer, isClientOffer, onToggle, onEdit }: OfferCardProps) => {
    const { t } = useTranslation();
    const [showOrder, setShowOrder] = useState(false);
    const { userInfo } = useAuth();

    const {
        id,
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
        offerExpirationTimeout,
        TTL,
    } = offer;

    const isOwnOffer = userInfo?.username === trader.name;

    // MARKET CONVENTION: BASE/QUOTE
    const BASE = fromAsset?.name ?? '';
    const QUOTE = toAsset?.name ?? '';
    const pair = `${BASE}/${QUOTE}`;

    const statusClass = isEnabled
        ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
        : 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30';

    const sideClass =
        type === 'buy'
            ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
            : 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30';

    const sideLabel =
        type === 'buy'
            ? t('offerCard.sideBuy', 'Buy (you sell QUOTE for BASE)')
            : t('offerCard.sideSell', 'Sell (you buy QUOTE for BASE)');

    const expiration = TTL
        ? new Date(TTL)
        : offerExpirationTimeout
            ? new Date(Date.now() + offerExpirationTimeout * 1000)
            : null;

    const copyId = async () => {
        try { await navigator.clipboard.writeText(id); } catch {}
    };

    const methodsText = useMemo(() => {
        const names = paymentMethods.map(m => m.paymentMethod?.name ?? m.name ?? '').filter(Boolean);
        const shown = names.slice(0, 3).join(', ');
        const extra = names.length > 3 ? ` +${names.length - 3}` : '';
        return { shown, full: names.join(', '), extra };
    }, [paymentMethods]);

    return (
        <>
            <div className="rounded-xl border border-white/10 bg-gray-900/75 text-white shadow-lg hover:border-white/20 hover:bg-gray-900/85 transition">
                {/* ROW 1: Trader | Badges | Actions (RIGHT) */}
                <div className="p-4 lg:p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Trader compact */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center font-bold text-sm">
                                {trader.name.charAt(0)}
                            </div>
                            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900', trader.online ? 'bg-green-500' : 'bg-gray-500')} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-semibold tracking-tight truncate">{trader.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    {trader.rating}
                </span>
                                <span>•</span>
                                <span>{trader.completedTrades} {t('offerCard.trades')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
            <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium capitalize', sideClass)}>
              {type === 'buy' ? t('offerCard.sell', 'Sell') : t('offerCard.buy', 'Buy') }
            </span>
                        {/* <span className={cn('px-2 py-0.5 text-[11px] rounded-full font-medium', statusClass)}>
              {isEnabled ? t('offerCard.enabled', 'Enabled') : t('offerCard.disabled', 'Disabled')}
            </span>*/}
                        {expiration && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-white/5 ring-1 ring-white/10 text-white/70">
                <Clock className="w-3.5 h-3.5" />
                                {expiration.toLocaleString()}
              </span>
                        )}
                    </div>

                    {/* Actions RIGHT */}
                    <div className="flex gap-2 self-stretch lg:self-auto lg:ml-auto">
                        {isClientOffer ? (
                            <>
                                <button
                                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition"
                                    onClick={onEdit}
                                >
                                    <Pencil className="w-3.5 h-3.5" /> {t('offerCard.edit')}
                                </button>
                                <button
                                    className={cn(
                                        'flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition',
                                        isEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                    )}
                                    onClick={onToggle}
                                >
                                    <PowerOff className="w-3.5 h-3.5" />
                                    {isEnabled ? t('offerCard.disable') : t('offerCard.enable')}
                                </button>
                            </>
                        ) : (
                            <button
                                className={cn(
                                    'flex-1 lg:flex-none rounded-xl px-4 py-2 text-sm font-semibold transition disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed',
                                    type === 'buy' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                )}
                                onClick={() => setShowOrder(true)}
                                disabled={isOwnOffer}
                            >
                                {type === 'buy' ? t('offerCard.sell') : t('offerCard.buy')}
                            </button>
                        )}
                    </div>
                </div>

                {/* ROW 2: PAIR BANNER — крупный тикер пары, направление, формула */}
                <div className="px-4 lg:px-3 pb-2">
                    <div className="w-full rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-2.5 flex items-center gap-3">
                        {/* Pair ticker */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold tracking-tight">{BASE}</span>
                            <span className="text-xl text-white/60">/</span>
                            <span className="text-xl font-semibold text-white/90">{QUOTE}</span>
                        </div>

                        {/* Direction pill */}
                        <div
                            className={cn(
                                'ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10',
                                type === 'buy' ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'
                            )}
                            title={sideLabel as string}
                        >
                            {type === 'buy' ? <ArrowDownUp className="w-3.5 h-3.5" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
                            <span className="uppercase">{type == 'sell' ? 'Buy' : 'Sell'}</span>
                        </div>

                        {/* Formula */}
                        <div className="ml-auto text-sm sm:text-base text-white/80">
                            <span className="font-medium">1 {BASE}</span>
                            <span className="mx-2 opacity-70">≈</span>
                            <span className="font-semibold">{price} {QUOTE}</span>
                        </div>
                    </div>
                </div>

                {/* ROW 3: ключевые показатели (BASE amount, QUOTE limits, методы оплаты) */}
                <div className="px-4 lg:px-3 pb-4">
                    <div className="grid grid-cols-12 items-center gap-3">
                        {/* AMOUNT in BASE (крупно) */}
                        <div className="col-span-6 sm:col-span-4">
                            <p className="text-[11px] text-white/60">{t('offerCard.amount')} ({BASE})</p>
                            <p className="text-xl leading-tight font-semibold">{amount}</p>
                            <p className="text-xs text-white/50">{t('offerCard.baseAsset', 'Base asset')}</p>
                        </div>

                        {/* LIMITS in QUOTE */}
                        <div className="col-span-6 sm:col-span-4">
                            <p className="text-[11px] text-white/60">{t('offerCard.limits')} ({QUOTE})</p>
                            <p className="text-lg leading-tight font-semibold">{limits.min} – {limits.max}</p>
                            <p className="text-xs text-white/50">{t('offerCard.perTrade', 'Per trade')}</p>
                        </div>

                        {/* METHODS one-line +N */}
                        <div className="col-span-12 sm:col-span-4 min-w-0">
                            <p className="text-[11px] text-white/60">{t('offerCard.paymentMethods')}</p>
                            <p className="text-sm text-white/80 truncate" title={methodsText.full}>
                                {methodsText.shown}
                                <span className="text-white/50">{methodsText.extra}</span>
                            </p>
                        </div>
                    </div>

                    {/* Bottom strip: условия + UUID с копированием */}
                    <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <div className="text-xs text-white/60 truncate">
                            {conditions && (
                                <>
                                    <span className="text-white/60">{t('offerCard.conditions')}:</span>{' '}
                                    <span className="text-white/80 truncate">{conditions}</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-white/50">{t('offerCard.id')}</span>
                            <code className="font-mono text-xs break-all">{id}</code>
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

            {showOrder && (
                <CreateOrderForm
                    offerId={id}
                    limits={limits}
                    paymentMethods={paymentMethods}
                    onClose={() => setShowOrder(false)}
                />
            )}
        </>
    );
};
