
import { useState } from 'react';
import { Header } from '@/components/Header';
import { OrderList } from '@/components/OrderList';
import { FilterPanel } from '@/components/FilterPanel';
//import { TradingStats } from '@/components/TradingStats';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [filters, setFilters] = useState({
    fromAsset: 'all',
    toAsset: 'all',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all'
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <div className="container mx-auto px-2 pt-4 sm:pt-6">
        {/* Trading
        <TradingStats />
        Stats */}
        {/* Main Content */}
        <div className="mt-16">
          {/* <div className="bg-gray-800 rounded-lg p-6">*/}
          <div>
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Orders List */}
            <OrderList type={activeTab} filters={filters} />
            </div>
          </div>
        </div>
      </div>
  );
};

export default Index;
