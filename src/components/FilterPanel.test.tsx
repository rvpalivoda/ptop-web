import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import i18n from '../i18n';

vi.mock('@/api/dictionaries', () => ({
  getAssets: vi.fn().mockResolvedValue([
    { id: 'BTC', name: 'BTC' },
    { id: 'ETH', name: 'ETH' },
  ]),
  getPaymentMethods: vi.fn().mockResolvedValue([
    { id: 'pm1', name: 'Сбербанк' },
    { id: 'pm2', name: 'Тинькофф' },
  ]),
  getCountries: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/clientPaymentMethods', () => ({
  getClientPaymentMethods: vi.fn().mockResolvedValue([]),
  createClientPaymentMethod: vi.fn(),
}));

const authState = { isAuthenticated: false };
const navigate = vi.fn();
vi.mock('@/context', () => ({ useAuth: () => authState }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  const baseFilters = {
    fromAsset: 'all',
    toAsset: 'all',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all'
  };

  beforeEach(() => { navigate.mockClear(); });

  it('calls onFiltersChange on asset change', async () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterPanel
        filters={baseFilters}
        onFiltersChange={onFiltersChange}
        activeTab="buy"
        onTabChange={() => {}}
      />
    );

    const select = (await screen.findAllByTestId('from-asset'))[0];
    fireEvent.change(select, {
      target: { value: 'BTC' }
    });

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...baseFilters,
      fromAsset: 'BTC'
    });
  });

  it('resets selection when assets are equal', async () => {
    const Wrapper = () => {
      const [filters, setFilters] = useState(baseFilters);
      return (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          activeTab="buy"
          onTabChange={() => {}}
        />
      );
    };

    render(<Wrapper />);

    const fromSelect = (await screen.findAllByTestId('from-asset'))[0];
    const toSelect = (await screen.findAllByTestId('to-asset'))[0];

    fireEvent.change(fromSelect, { target: { value: 'BTC' } });
    fireEvent.change(toSelect, { target: { value: 'BTC' } });

    expect(toSelect).toHaveValue('all');
  });

  it('calls onFiltersChange on payment method change', async () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterPanel
        filters={baseFilters}
        onFiltersChange={onFiltersChange}
        activeTab="buy"
        onTabChange={() => {}}
      />
    );

    await screen.findAllByText('Сбербанк');
    const selects = await screen.findAllByTestId('payment-method');
    const user = userEvent.setup();
    await user.selectOptions(selects[selects.length - 1], 'pm1');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...baseFilters,
      paymentMethod: 'pm1'
    });
  });

  it('switches trade type', async () => {
    const onTabChange = vi.fn();
    render(
      <FilterPanel
        filters={baseFilters}
        onFiltersChange={() => {}}
        activeTab="buy"
        onTabChange={onTabChange}
      />
    );

    await screen.findAllByTestId('from-asset');
    const sellBtn = screen.getAllByTestId('sell-tab').pop();
    if (sellBtn) {
      fireEvent.click(sellBtn);
    }
    expect(onTabChange).toHaveBeenCalledWith('sell');
  });

  it('redirects to login for guest', async () => {
    authState.isAuthenticated = false;
    render(
      <FilterPanel
        filters={baseFilters}
        onFiltersChange={() => {}}
        activeTab="buy"
        onTabChange={() => {}}
      />
    );

    await screen.findAllByTestId('from-asset');
    const btns = screen.getAllByTestId('create-advert');
    fireEvent.click(btns[btns.length - 1]);

    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('opens create offer form for authenticated user', async () => {
    authState.isAuthenticated = true;
    render(
      <FilterPanel
        filters={baseFilters}
        onFiltersChange={() => {}}
        activeTab="buy"
        onTabChange={() => {}}
      />
    );

    await screen.findAllByTestId('from-asset');
    const btns = screen.getAllByTestId('create-advert');
    fireEvent.click(btns[btns.length - 1]);

    expect(await screen.findByText(i18n.t('createOffer.createTitle') as string)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
