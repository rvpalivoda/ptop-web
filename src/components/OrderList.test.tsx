import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '../i18n';
import { OrderList } from './OrderList';
import { getOffers } from '@/api/offers';

vi.mock('@/api/offers', () => ({
  getOffers: vi.fn().mockResolvedValue([]),
}));

describe('OrderList', () => {
  const baseFilters = {
    fromAsset: 'all',
    toAsset: 'all',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
  };

  it('запрашивает офферы при монтировании', async () => {
    render(<OrderList type="buy" filters={baseFilters} />);
    await waitFor(() => {
      expect(getOffers).toHaveBeenCalled();
    });
  });

  it('запрашивает офферы при изменении фильтров', async () => {
    const { rerender } = render(
      <OrderList type="buy" filters={baseFilters} />,
    );
    await waitFor(() => expect(getOffers).toHaveBeenCalled());
    (getOffers as unknown as ReturnType<typeof vi.fn>).mockClear();
    const newFilters = { ...baseFilters, minAmount: '10' };
    rerender(<OrderList type="buy" filters={newFilters} />);
    await waitFor(() => expect(getOffers).toHaveBeenCalled());
  });
});
