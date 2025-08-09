import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBalances } from './balances';
import { createWallet } from './wallets';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('balances api', () => {
  it('getBalances возвращает список балансов', async () => {
    const mockData = [
      {
        amount: 1,
        id: 'btc',
        isActive: true,
        isConvertible: true,
        name: 'Bitcoin',
        type: 'crypto',
        value: 'addr',
      },
    ];
    const mockFetch = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as any);

    const res = await getBalances();
    expect(mockFetch).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('createWallet отправляет asset_id и возвращает кошелек', async () => {
    const mockWallet = { id: '1', assetID: 'btc', value: 'addr' };
    const mockFetch = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWallet,
      } as any);

    const res = await createWallet('btc');
    const [url, opts] = mockFetch.mock.calls[0];
    expect((url as string).endsWith('/client/wallets')).toBe(true);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ asset_id: 'btc' });
    expect(res).toEqual(mockWallet);
  });
});
