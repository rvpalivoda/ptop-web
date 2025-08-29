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

// Available order actions based on role/status
export type OrderActionName = 'paid' | 'release' | 'cancel' | 'dispute' | 'resolve';
export type OrderResolveResult = 'RELEASED' | 'CANCELLED';
export interface OrderActionInfo {
  name: OrderActionName;
  label?: string;
  reasonRequired?: boolean; // for cancel/dispute
  commentRequired?: boolean; // for resolve
  resultOptions?: OrderResolveResult[]; // for resolve
}

function canonicalizeActionName(name: string | undefined): OrderActionName | undefined {
  if (!name) return undefined;
  const flat = name.toLowerCase().replace(/[^a-z]/g, ''); // remove non-letters: mark_paid -> markpaid
  switch (flat) {
    case 'paid':
    case 'markpaid':
    case 'setpaid':
      return 'paid';
    case 'release':
    case 'releasefunds':
    case 'releasemoney':
      return 'release';
    case 'cancel':
    case 'cancelorder':
      return 'cancel';
    case 'dispute':
    case 'opendispute':
      return 'dispute';
    case 'resolve':
    case 'resolvedispute':
      return 'resolve';
    default:
      return undefined;
  }
}

function normalizeActions(raw: unknown): OrderActionInfo[] {
  // Разворачиваем обёртки вида { actions: [...] } | { data: { actions: [...] } } | { result: [...] }
  const unwrap = (v: unknown): unknown => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      if (Array.isArray(obj.actions)) return obj.actions;
      if (obj.data && Array.isArray((obj.data as any).actions)) return (obj.data as any).actions;
      if (Array.isArray(obj.allowedActions)) return obj.allowedActions as unknown[];
      if (Array.isArray(obj.availableActions)) return obj.availableActions as unknown[];
      if (Array.isArray(obj.result)) return obj.result as unknown[];
    }
    return v;
  };

  const data = unwrap(raw);
  // Variant 1: array of strings
  if (Array.isArray(data) && data.every((x) => typeof x === 'string')) {
    return (data as string[])
      .map((n) => canonicalizeActionName(n))
      .filter((n): n is OrderActionName => Boolean(n))
      .map((name) => ({ name }));
  }
  // Variant 2: array of objects with (name|action|type) + flags
  if (Array.isArray(data) && data.every((x) => typeof x === 'object' && x != null)) {
    return (data as Record<string, unknown>[])
      .map((it): OrderActionInfo | undefined => {
        const nameRaw = (it['name'] || it['action'] || it['type']) as string | undefined;
        const name = canonicalizeActionName(nameRaw);
        const label = (it['label'] || it['title']) as string | undefined;
        const reasonRequired = Boolean(
          it['reasonRequired'] || it['requiresReason'] || it['needReason']
        );
        const commentRequired = Boolean(
          it['commentRequired'] || it['requiresComment'] || it['needComment']
        );
        const resultOptions = (it['resultOptions'] || it['results'] || it['allowedResults']) as OrderResolveResult[] | undefined;
        if (!name) return undefined;
        return {
          name: name as OrderActionName,
          label,
          reasonRequired,
          commentRequired,
          resultOptions,
        } as OrderActionInfo;
      })
      .filter((x): x is OrderActionInfo => Boolean(x));
  }
  return [];
}

export async function getOrderActions(id: string): Promise<OrderActionInfo[]> {
  // If backend exposes /orders/{id}/actions — use it.
  // Return normalized structure; caller is schema-agnostic.
  const raw = await apiRequest<unknown>(`/orders/${id}/actions`);
  return normalizeActions(raw);
}

// Status transitions according to doc/order-status.md
export function markOrderPaid(id: string, paidAt?: string) {
  const body = paidAt ? { paidAt } : undefined as unknown as Record<string, string> | undefined;
  return apiRequest<OrderFull>(`/orders/${id}/paid`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  } as RequestInit);
}

export function releaseOrder(id: string) {
  return apiRequest<OrderFull>(`/orders/${id}/release`, {
    method: 'POST',
  });
}

export function cancelOrder(id: string, reason?: string) {
  const body = reason ? { reason } : undefined as unknown as Record<string, string> | undefined;
  return apiRequest<OrderFull>(`/orders/${id}/cancel`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  } as RequestInit);
}

export function openDispute(id: string, reason?: string) {
  const body = reason ? { reason } : undefined as unknown as Record<string, string> | undefined;
  return apiRequest<OrderFull>(`/orders/${id}/dispute`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  } as RequestInit);
}

export function resolveDispute(id: string, result: 'RELEASED' | 'CANCELLED', comment?: string) {
  const body: { result: 'RELEASED' | 'CANCELLED'; comment?: string } = { result };
  if (comment) body.comment = comment;
  return apiRequest<OrderFull>(`/orders/${id}/dispute/resolve`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface OrderMessage {
  id: string;
  chatID: string;
  clientID: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  readAt?: string;
  fileURL?: string;
  fileType?: string;
  fileSize?: number;
  type?: string;
}

export function createOrderMessage(orderId: string, content: string, file?: File) {
  if (file) {
    const formData = new FormData();
    if (content) {
      formData.append('content', content);
    }
    formData.append('file', file);
    return apiRequest<OrderMessage>(`/orders/${orderId}/messages`, {
      method: 'POST',
      body: formData,
    });
  }
  return apiRequest<OrderMessage>(`/orders/${orderId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function markOrderMessageRead(orderId: string, msgId: string) {
  return apiRequest<OrderMessage>(`/orders/${orderId}/messages/${msgId}/read`, {
    method: 'PATCH',
  });
}

export function getOrderMessages(orderId: string) {
  const ts = Date.now();
  return apiRequest<OrderMessage[]>(`/orders/${orderId}/messages?t=${ts}` as string, {
    // Explicitly disable HTTP cache for chat history
    cache: 'no-store',
  } as RequestInit);
}
