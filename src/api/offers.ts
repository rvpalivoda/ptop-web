import { apiRequest } from './client';

export interface CreateOfferPayload {
  amount: string;
  client_payment_method_ids: string[];
  conditions: string;
  from_asset_id: string;
  max_amount: string;
  min_amount: string;
  order_expiration_timeout: number;
  price: string;
  to_asset_id: string;
}

export interface Offer {
  id: string;
}

export function createOffer(data: CreateOfferPayload) {
  return apiRequest<Offer>("/client/offers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
