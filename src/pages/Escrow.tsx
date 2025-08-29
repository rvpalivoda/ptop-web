import { useTranslation } from 'react-i18next';

const Escrow = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-3 pt-16 md:pt-24 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.escrow')}</h1>
      </div>
    </div>
  );
};

export default Escrow;
