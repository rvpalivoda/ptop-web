import { apiRequest } from './client';

export interface ClientAsset {
  amount: number;
  id: string;
  isActive: boolean;
  isConvertible: boolean;
  name: string;
  type: string;
  value?: string;
}

export async function getClientAssets() {
  return apiRequest<ClientAsset[]>('/client/assets');
}
