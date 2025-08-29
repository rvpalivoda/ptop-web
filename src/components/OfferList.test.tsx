import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '../i18n';
import { OfferList } from './OfferList';
import { getOffers } from '@/api/offers';

vi.mock('@/api/offers', () => ({
  getOffers: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ tokens: null }),
}));

describe('OfferList', () => {
  const baseFilters = {
    fromAsset: 'all',
    toAsset: 'all',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
  };

  it('fetches offers on mount', async () => {
    render(<OfferList type="buy" filters={baseFilters} />);
    await waitFor(() => {
      expect(getOffers).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'sell' }),
      );
    });
  });

  it('fetches offers on filter change', async () => {
    const { rerender } = render(
      <OfferList type="buy" filters={baseFilters} />,
    );
    await waitFor(() => expect(getOffers).toHaveBeenCalled());
    (getOffers as unknown as ReturnType<typeof vi.fn>).mockClear();
    const newFilters = { ...baseFilters, minAmount: '10' };
    rerender(<OfferList type="buy" filters={newFilters} />);
    await waitFor(() => expect(getOffers).toHaveBeenCalled());
  });
});
