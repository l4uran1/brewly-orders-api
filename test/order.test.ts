import { test } from "node:test";
import assert from "node:assert/strict";
import { createOrder, parseNewOrder, ValidationError } from "../src/order.ts";

const valid = {
  customerEmail: "ana@example.com",
  items: [
    { sku: "ETHIOPIA-250G", quantity: 2, unitPriceCents: 1250 },
    { sku: "V60-FILTERS", quantity: 1, unitPriceCents: 499 },
  ],
};

test("parseNewOrder accepts a valid order, in EUR by default", () => {
  assert.deepEqual(parseNewOrder(valid), { ...valid, currency: "EUR" });
});

test("parseNewOrder accepts an order in GBP", () => {
  assert.equal(parseNewOrder({ ...valid, currency: "GBP" }).currency, "GBP");
});

test("parseNewOrder rejects a currency we cannot charge in", () => {
  assert.throws(() => parseNewOrder({ ...valid, currency: "USD" }), /currency/);
});

test("parseNewOrder rejects an invalid email", () => {
  assert.throws(() => parseNewOrder({ ...valid, customerEmail: "ana" }), ValidationError);
});

test("parseNewOrder rejects an order without items", () => {
  assert.throws(() => parseNewOrder({ ...valid, items: [] }), ValidationError);
});

test("parseNewOrder rejects a non-integer quantity", () => {
  const items = [{ sku: "X", quantity: 1.5, unitPriceCents: 100 }];
  assert.throws(() => parseNewOrder({ ...valid, items }), /quantity/);
});

test("createOrder adds up the total in cents", () => {
  const order = createOrder(valid, "o-1", new Date("2026-11-05T10:00:00Z"));
  assert.equal(order.totalCents, 2 * 1250 + 499);
  assert.equal(order.createdAt, "2026-11-05T10:00:00.000Z");
});
