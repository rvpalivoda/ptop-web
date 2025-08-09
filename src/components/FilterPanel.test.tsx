import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../i18n';

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

import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  const baseFilters = {
    fromAsset: 'all',
    toAsset: 'all',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all'
  };

  it('вызывает onFiltersChange при смене актива', async () => {
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

  it('вызывает onFiltersChange при смене метода оплаты', async () => {
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

  it('переключает тип сделки', async () => {
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

  it('открывает форму создания объявления', async () => {
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

    expect(await screen.findByText('Создать объявление')).toBeInTheDocument();
  });
});
