import { apiRequest } from './client';

export interface ClientPaymentMethod {
  id?: string;
  ID?: string;
  name?: string;
  Name?: string;
  paymentMethodID?: string;
  countryID?: string;
  city?: string;
  postCode?: string;
  detailedInformation?: string;
  detailed_information?: string;
  paymentMethod?: { id?: string; name?: string };
  country?: { id?: string; name?: string };
}

export interface CreateClientPaymentMethodPayload {
  city: string;
  country_id: string;
  name: string;
  payment_method_id: string;
  post_code: string;
  detailed_information: string;
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

export function updateClientPaymentMethod(id: string, data: CreateClientPaymentMethodPayload) {
  return apiRequest<ClientPaymentMethod>(`/client/payment-methods/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteClientPaymentMethod(id: string) {
  return apiRequest<{ status: string }>(`/client/payment-methods/${id}`, {
    method: "DELETE",
  });
}
