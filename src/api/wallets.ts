import { apiRequest } from './client';

export interface Wallet {
  id: string;
  assetID: string;
  value: string;
}

export async function createWallet(assetId: string) {
  return apiRequest<Wallet>('/client/wallets', {
    method: 'POST',
    body: JSON.stringify({ asset_id: assetId }),
  });
}
