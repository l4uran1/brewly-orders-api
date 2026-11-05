import type { Order } from "./order.ts";

export const ORDERS_CREATED = "orders.created";

/**
 * Payload of `orders.created`. This is a contract with other services
 * (see docs/system-map.md in the ecosystem repo): changing it is a cross-repo change.
 */
export type OrderCreated = {
  orderId: string;
  customerEmail: string;
  totalCents: number;
  createdAt: string;
};

export function toOrderCreated(order: Order): OrderCreated {
  return {
    orderId: order.id,
    customerEmail: order.customerEmail,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
  };
}
