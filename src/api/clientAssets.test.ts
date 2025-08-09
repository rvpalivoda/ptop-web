import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientAssets } from './clientAssets';
import { createWallet } from './wallets';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('client assets api', () => {
  it('getClientAssets возвращает список активов клиента', async () => {
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

    const res = await getClientAssets();
    const [url] = mockFetch.mock.calls[0];
    expect((url as string).endsWith('/client/assets')).toBe(true);
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
