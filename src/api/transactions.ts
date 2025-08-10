import { apiRequest } from './client';

export interface BaseTransaction {
  id: string;
  assetID: string;
  assetName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
}

export type TransactionIn = BaseTransaction & {
  clientID: string;
  walletID: string;
};

export type TransactionInternal = BaseTransaction & {
  fromClientID: string;
  toClientID: string;
  orderInfo?: string;
};

export type TransactionOut = BaseTransaction & {
  clientID: string;
  fromAddress: string;
  toAddress: string;
};

function buildQuery(limit: number, offset: number) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return params.toString();
}

export function getIncomingTransactions(limit: number, offset: number) {
  const query = buildQuery(limit, offset);
  return apiRequest<TransactionIn[]>(`/client/transactions/in?${query}`);
}

export function getInternalTransactions(limit: number, offset: number) {
  const query = buildQuery(limit, offset);
  return apiRequest<TransactionInternal[]>(`/client/transactions/internal?${query}`);
}

export function getOutgoingTransactions(limit: number, offset: number) {
  const query = buildQuery(limit, offset);
  return apiRequest<TransactionOut[]>(`/client/transactions/out?${query}`);
}

