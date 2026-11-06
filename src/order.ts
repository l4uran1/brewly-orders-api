export type OrderItem = {
  sku: string;
  quantity: number;
  unitPriceCents: number;
};

/** The currencies our payment provider can charge in (docs/product/constraints.md). */
export const CURRENCIES = ["EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * EUR per one unit of each currency. A fixed table until we sell in volume (see the
 * add-order-currency design): it is stamped on each order, so changing it never alters
 * orders or invoices already created.
 */
export const EUR_EXCHANGE_RATES: Record<Currency, number> = { EUR: 1, GBP: 1.17 };

export type Order = {
  id: string;
  customerEmail: string;
  currency: Currency;
  /** EUR per one unit of `currency`, fixed when the order was created. */
  eurExchangeRate: number;
  items: OrderItem[];
  /** Minor units of `currency`, VAT included. */
  totalCents: number;
  createdAt: string;
};

export type NewOrder = {
  customerEmail: string;
  currency: Currency;
  items: OrderItem[];
};

export class ValidationError extends Error {}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Validates the request body of POST /orders. Prices are in minor units, VAT included. */
export function parseNewOrder(body: unknown): NewOrder {
  if (typeof body !== "object" || body === null) throw new ValidationError("body must be an object");
  const { customerEmail, items, currency = "EUR" } = body as Record<string, unknown>;

  if (typeof customerEmail !== "string" || !EMAIL.test(customerEmail)) {
    throw new ValidationError("customerEmail must be a valid email");
  }
  if (!CURRENCIES.includes(currency as Currency)) {
    throw new ValidationError(`currency must be one of ${CURRENCIES.join(", ")}`);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError("items must be a non-empty array");
  }

  return {
    customerEmail,
    currency: currency as Currency,
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
  return {
    id,
    customerEmail: input.customerEmail,
    currency: input.currency,
    eurExchangeRate: EUR_EXCHANGE_RATES[input.currency],
    items: input.items,
    totalCents,
    createdAt: now.toISOString(),
  };
}
