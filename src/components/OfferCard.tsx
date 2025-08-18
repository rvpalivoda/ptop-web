import { Star, MessageCircle, Pencil, PowerOff } from 'lucide-react';

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
      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-0  transition hover:border-white/20 hover:bg-gray-900/70text-white shadow-lg">
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
                <span>{trader.completedTrades} сделок</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="flex-1 lg:mx-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-white/60">Валюта</p>
                <p className="font-medium">{currency}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Количество</p>
                <p className="font-medium">{amount}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Цена</p>
                <p className="font-medium">₽{price}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Лимиты</p>
                <p className="font-medium">₽{limits.min} - ₽{limits.max}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-white/60 mb-2">Способы оплаты</p>
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
            {(conditions || orderExpirationTimeout || TTL || typeof isEnabled === 'boolean') && (
              <div className="mt-3 space-y-1">
                {conditions && (
                  <p className="text-sm text-gray-400">Условия: {conditions}</p>
                )}
                {(TTL || orderExpirationTimeout) && (
                  <p className="text-sm text-gray-400">
                    Срок действия: {TTL ?? `${orderExpirationTimeout} сек`}
                  </p>
                )}
                {typeof isEnabled === 'boolean' && (
                  <p className="text-sm text-gray-400">
                    Статус: {isEnabled ? 'Активно' : 'Неактивно'}
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
                    <Pencil className="w-4 h-4" /> Изменить
                  </button>
                  <button
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                          isEnabled
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                      }`}
                      onClick={onToggle}
                  >
                    <PowerOff className="w-4 h-4" /> {isEnabled ? 'Отключить' : 'Включить'}
                  </button>
                </>
            ) : (
                <>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition">
                    <MessageCircle className="w-4 h-4" /> Чат
                  </button>
                  <button
                      className={`px-6 py-2 rounded-xl font-medium text-sm transition ${
                          type === 'buy'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {type === 'buy' ? 'Продать' : 'Купить'}
                  </button>
                </>
            )}
          </div>
        </div>
      </div>
  );
};