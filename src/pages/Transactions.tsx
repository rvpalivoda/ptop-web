import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';

const Transactions = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.transactions')}</h1>
      </div>
    </div>
  );
};

export default Transactions;
