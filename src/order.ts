export type OrderItem = {
  sku: string;
  quantity: number;
  unitPriceCents: number;
};

export type Order = {
  id: string;
  customerEmail: string;
  items: OrderItem[];
  totalCents: number;
  createdAt: string;
};

export type NewOrder = {
  customerEmail: string;
  items: OrderItem[];
};

export class ValidationError extends Error {}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Validates the request body of POST /orders. Prices are in cents, VAT included. */
export function parseNewOrder(body: unknown): NewOrder {
  if (typeof body !== "object" || body === null) throw new ValidationError("body must be an object");
  const { customerEmail, items } = body as Record<string, unknown>;

  if (typeof customerEmail !== "string" || !EMAIL.test(customerEmail)) {
    throw new ValidationError("customerEmail must be a valid email");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError("items must be a non-empty array");
  }

  return {
    customerEmail,
    items: items.map((item, i) => {
      const { sku, quantity, unitPriceCents } = (item ?? {}) as Record<string, unknown>;
      if (typeof sku !== "string" || sku === "") throw new ValidationError(`items[${i}].sku is required`);
      if (!Number.isInteger(quantity) || (quantity as number) < 1) {
        throw new ValidationError(`items[${i}].quantity must be a positive integer`);
      }
      if (!Number.isInteger(unitPriceCents) || (unitPriceCents as number) < 0) {
        throw new ValidationError(`items[${i}].unitPriceCents must be a non-negative integer`);
      }
      return { sku, quantity: quantity as number, unitPriceCents: unitPriceCents as number };
    }),
  };
}

export function createOrder(input: NewOrder, id: string, now: Date): Order {
  const totalCents = input.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  return { id, customerEmail: input.customerEmail, items: input.items, totalCents, createdAt: now.toISOString() };
}
