import { apiRequest } from './client';

export interface Balance {
  amount: number;
  id: string;
  isActive: boolean;
  isConvertible: boolean;
  name: string;
  type: string;
  value?: string;
}

export async function getBalances() {
  return apiRequest<Balance[]>('/client/balances');
}
