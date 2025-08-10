import { apiRequest } from './client';

export interface CreateOfferPayload {
  amount: string;
  client_payment_method_ids: string[];
  conditions: string;
  type: 'buy' | 'sell';
  from_asset_id: string;
  max_amount: string;
  min_amount: string;
  order_expiration_timeout: number;
  price: string;
  to_asset_id: string;
}

export interface Offer {
  id: string;
  amount: number;
  price: number;
  minAmount: number;
  maxAmount: number;
  fromAssetID: string;
  toAssetID: string;
  clientID: string;
  createdAt: string;
  isEnabled?: boolean;
  type?: 'buy' | 'sell';
  conditions?: string;
  orderExpirationTimeout?: number;
  clientPaymentMethodIDs?: string[];
}

export interface OfferFilters {
  from_asset?: string;
  to_asset?: string;
  min_amount?: string;
  max_amount?: string;
  payment_method?: string;
  type?: 'buy' | 'sell';
}

export function getOffers(filters: OfferFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return apiRequest<Offer[]>(`/offers${query ? `?${query}` : ''}`);
}

export function createOffer(data: CreateOfferPayload) {
  return apiRequest<Offer>("/client/offers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getClientOffers() {
  return apiRequest<Offer[]>("/client/offers");
}

export function updateOffer(id: string, data: CreateOfferPayload) {
  return apiRequest<Offer>(`/client/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function enableOffer(id: string) {
  return apiRequest<Offer>(`/client/offers/${id}/enable`, {
    method: 'POST',
  });
}

export function disableOffer(id: string) {
  return apiRequest<Offer>(`/client/offers/${id}/disable`, {
    method: 'POST',
  });
}
