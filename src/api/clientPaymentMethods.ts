import { apiRequest } from './client';

export interface ClientPaymentMethod {
  id: string;
  name: string;
  paymentMethodID: string;
  countryID: string;
  city: string;
  postCode: string;
}

export interface CreateClientPaymentMethodPayload {
  city: string;
  country_id: string;
  name: string;
  payment_method_id: string;
  post_code: string;
}

export function getClientPaymentMethods() {
  return apiRequest<ClientPaymentMethod[]>("/client/payment-methods");
}

export function createClientPaymentMethod(data: CreateClientPaymentMethodPayload) {
  return apiRequest<ClientPaymentMethod>("/client/payment-methods", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
