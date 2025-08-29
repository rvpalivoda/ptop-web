import { describe, it, expect, vi } from 'vitest';
import { getPaymentMethods } from './dictionaries';
import { apiRequest } from './client';

vi.mock('./client', () => ({
  apiRequest: vi.fn(),
}));

describe('dictionaries api', () => {
  it('requests payment methods without country', async () => {
    const apiReqMock = apiRequest as unknown as ReturnType<typeof vi.fn>;
    apiReqMock.mockResolvedValue([]);
    await getPaymentMethods();
    expect(apiRequest).toHaveBeenCalledWith('/payment-methods');
  });

  it('requests payment methods with specified country', async () => {
    const apiReqMock = apiRequest as unknown as ReturnType<typeof vi.fn>;
    apiReqMock.mockResolvedValue([]);
    await getPaymentMethods('RU');
    expect(apiRequest).toHaveBeenCalledWith('/payment-methods?country=RU');
  });
});
