export async function commerceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/backend${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers }, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.message ?? data.message ?? `Request failed (${response.status}).`;
    throw new Error(Array.isArray(message) ? message.join(' ') : message);
  }
  return data as T;
}
export const jsonBody = (data: unknown) => JSON.stringify(data);
export const money = (value: string | number) => new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(Number(value));
export type CartItem = { id: string; quantity: number; productId: string; product: { name: string; basePrice: string; discountPrice?: string | null }; variant: { color: string; size: string; price?: string | null; images: Array<{ url: string }> }; lensPackage?: { name: string; price: string } | null };
export const linePrice = (item: CartItem) => Number(item.variant.price ?? item.product.discountPrice ?? item.product.basePrice) + Number(item.lensPackage?.price ?? 0);
export type Order = { id: string; orderNumber: string; status: string; paymentStatus: string; totalAmount: string; createdAt: string; items: Array<{ id: string; productName: string; quantity: number; totalPrice: string }>; statusHistory: Array<{ id: string; status: string; note: string | null; createdAt: string }> };
export type Prescription = { id: string; label: string; odSph?: string; osSph?: string; odCyl?: string; osCyl?: string; odAxis?: number; osAxis?: number; pdRight?: string; pdLeft?: string; doctorName?: string };
export type Store = { id: string; name: string; address: string; phone?: string; openingHours?: string; services: string[] };
