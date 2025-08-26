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

export interface OrderFull {
  id: string;
  amount: number;
  price: number;
  authorID: string;
  buyerID: string;
  sellerID: string;
  offerOwnerID: string;
  author?: {
    username?: string;
    rating?: number;
    ordersCount?: number;
  };
  buyer?: {
    username?: string;
    rating?: number;
    ordersCount?: number;
  };
  seller?: {
    username?: string;
    rating?: number;
    ordersCount?: number;
  };
  offerOwner?: {
    username?: string;
    rating?: number;
    ordersCount?: number;
  };
  offer?: {
    type?: string;
  };
  fromAssetID: string;
  toAssetID: string;
  fromAsset?: { name?: string };
  toAsset?: { name?: string };
  clientPaymentMethodID: string;
  clientPaymentMethod?: {
    name?: string;
    paymentMethod?: { name?: string };
  };
  status: string;
  createdAt: string;
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

export function getClientOrders(role: 'author' | 'offerOwner' = 'author') {
  return apiRequest<OrderFull[]>(`/client/orders?role=${role}`);
}

export function getOrder(id: string) {
  return apiRequest<OrderFull>(`/orders/${id}`);
}
