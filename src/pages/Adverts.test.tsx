import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Adverts from './Adverts';
import '../i18n';
import { getClientOffers } from '@/api/offers';

vi.mock('@/api/offers', () => ({
  getClientOffers: vi.fn().mockResolvedValue([
    {
      id: '2',
      amount: 1,
      price: 2,
      minAmount: 1,
      maxAmount: 2,
      fromAssetID: 'EUR',
      toAssetID: 'RUB',
      clientID: 'c1',
      createdAt: '2024-01-03T00:00:00Z',
    },
    {
      id: '1',
      amount: 1,
      price: 2,
      minAmount: 1,
      maxAmount: 2,
      fromAssetID: 'USD',
      toAssetID: 'RUB',
      clientID: 'c1',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ]),
}));

vi.mock('@/context', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

describe('Adverts page', () => {
  it('отображает офферы клиента в порядке даты создания', async () => {
    render(
      <MemoryRouter>
        <Adverts />
      </MemoryRouter>,
    );
    await waitFor(() => expect(getClientOffers).toHaveBeenCalled());
    const items = await screen.findAllByTestId('client-offer');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('EUR/RUB');
    expect(items[1]).toHaveTextContent('USD/RUB');
  });
});
