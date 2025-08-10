import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import {
  getIncomingTransactions,
  getInternalTransactions,
  getOutgoingTransactions,
  BaseTransaction,
} from '@/api';

const LIMIT = 10;

type TabKey = 'in' | 'internal' | 'out';

const Transactions = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('in');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<BaseTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetcher =
      tab === 'in'
        ? getIncomingTransactions
        : tab === 'internal'
          ? getInternalTransactions
          : getOutgoingTransactions;
    setLoading(true);
    fetcher(LIMIT, offset)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [tab, offset]);

  const nextPage = () => {
    if (items.length === LIMIT) {
      setOffset((o) => o + LIMIT);
    }
  };

  const prevPage = () => {
    setOffset((o) => Math.max(0, o - LIMIT));
  };

  const renderList = () => {
    if (loading) {
      return <p>{t('transactions.loading')}</p>;
    }
    if (!items.length) {
      return <p>{t('transactions.noData')}</p>;
    }
    return (
      <>
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-2">{t('transactions.id')}</th>
                <th className="px-4 py-2">{t('transactions.asset')}</th>
                <th className="px-4 py-2">{t('transactions.status')}</th>
                <th className="px-4 py-2">{t('transactions.createdAt')}</th>
                <th className="px-4 py-2">{t('transactions.updatedAt')}</th>
                <th className="px-4 py-2 text-right">{t('transactions.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {items.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-800">
                  <td className="px-4 py-2 break-all">{tx.id}</td>
                  <td className="px-4 py-2">{tx.assetName}</td>
                  <td className="px-4 py-2 capitalize">{tx.status}</td>
                  <td className="px-4 py-2">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(tx.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{tx.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4">
          {items.map((tx) => (
            <div
              key={tx.id}
              className="p-4 bg-gray-800/80 rounded-xl ring-1 ring-white/5"
            >
              <div className="text-xs text-gray-400">
                {t('transactions.id')}: <span className="text-gray-200">{tx.id}</span>
              </div>
              <div className="mt-1 text-sm flex justify-between">
                <span className="text-gray-400">
                  {t('transactions.asset')}
                </span>
                <span className="text-gray-200">{tx.assetName}</span>
              </div>
              <div className="mt-1 text-sm flex justify-between">
                <span className="text-gray-400">
                  {t('transactions.status')}
                </span>
                <span className="text-gray-200 capitalize">{tx.status}</span>
              </div>
              <div className="mt-1 text-sm flex justify-between">
                <span className="text-gray-400">
                  {t('transactions.createdAt')}
                </span>
                <span className="text-gray-200">
                  {new Date(tx.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-sm flex justify-between">
                <span className="text-gray-400">
                  {t('transactions.updatedAt')}
                </span>
                <span className="text-gray-200">
                  {new Date(tx.updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-sm flex justify-between">
                <span className="text-gray-400">
                  {t('transactions.amount')}
                </span>
                <span className="text-gray-200">{tx.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.transactions')}</h1>
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as TabKey);
            setOffset(0);
          }}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="in">{t('transactions.incoming')}</TabsTrigger>
            <TabsTrigger value="internal">{t('transactions.internal')}</TabsTrigger>
            <TabsTrigger value="out">{t('transactions.outgoing')}</TabsTrigger>
          </TabsList>
          <TabsContent value="in">{renderList()}</TabsContent>
          <TabsContent value="internal">{renderList()}</TabsContent>
          <TabsContent value="out">{renderList()}</TabsContent>
        </Tabs>
        <div className="flex justify-between mt-4">
          <button
            onClick={prevPage}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
          >
            {t('transactions.prev')}
          </button>
          <button
            onClick={nextPage}
            disabled={items.length < LIMIT}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
          >
            {t('transactions.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
