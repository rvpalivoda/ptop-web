import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '../i18n';
import { OfferCard } from './OfferCard';
import { AuthProvider } from '@/context/AuthContext';

const renderWithUser = (username: string, traderName: string) => {
  localStorage.setItem(
    'peerex_user_info',
    JSON.stringify({ username, twofaEnabled: false, pinCodeSet: false }),
  );
  const offer = {
    id: '1',
    trader: { name: traderName, rating: 5, completedTrades: 10, online: true },
    fromAsset: { name: 'USD' },
    toAsset: { name: 'BTC' },
    amount: '100',
    price: '1',
    paymentMethods: ['PayPal'],
    limits: { min: '10', max: '100' },
    type: 'buy' as const,
  };
  render(
    <AuthProvider>
      <OfferCard offer={offer} />
    </AuthProvider>,
  );
};

describe('OfferCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
  });

  it('отключает кнопку для своего оффера', () => {
    renderWithUser('Alice', 'Alice');
    const btn = screen.getByRole('button', { name: /sell/i });
    expect(btn).toBeDisabled();
  });

  it('включает кнопку для чужого оффера', () => {
    renderWithUser('Alice', 'Bob');
    const btn = screen.getByRole('button', { name: /sell/i });
    expect(btn).not.toBeDisabled();
  });
});
