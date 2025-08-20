import { apiRequest } from './client';

export interface Order {
  id: string;
  amount: number;
  price: number;
  buyerID: string;
  sellerID: string;
  fromAssetID: string;
  toAssetID: string;
  clientPaymentMethodID: string;
  offerID: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  releasedAt?: string;
  isEscrow?: boolean;
}

export interface CreateOrderPayload {
  amount: string;
  client_payment_method_id: string;
  offer_id: string;
  pin_code: string;
}

export function createOrder(data: CreateOrderPayload) {
  return apiRequest<Order>('/client/order', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
