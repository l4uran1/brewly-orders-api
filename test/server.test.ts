import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { buildServer } from "../src/server.ts";
import { InMemoryPublisher } from "../src/queue.ts";

async function withServer(fn: (url: string, publisher: InMemoryPublisher) => Promise<void>) {
  const publisher = new InMemoryPublisher();
  const server = buildServer({ publisher, newId: () => "o-1", now: () => new Date("2026-11-05T10:00:00Z") });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  try {
    await fn(`http://localhost:${(server.address() as AddressInfo).port}`, publisher);
  } finally {
    server.close();
  }
}

const post = (url: string, body: unknown) =>
  fetch(`${url}/orders`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("POST /orders creates the order and publishes orders.created", () =>
  withServer(async (url, publisher) => {
    const res = await post(url, { customerEmail: "ana@example.com", items: [{ sku: "X", quantity: 2, unitPriceCents: 1250 }] });

    assert.equal(res.status, 201);
    assert.deepEqual(publisher.messages, [
      {
        topic: "orders.created",
        payload: { orderId: "o-1", customerEmail: "ana@example.com", totalCents: 2500, createdAt: "2026-11-05T10:00:00.000Z" },
      },
    ]);
  }));

test("POST /orders rejects an invalid order without publishing", () =>
  withServer(async (url, publisher) => {
    const res = await post(url, { customerEmail: "ana", items: [] });

    assert.equal(res.status, 400);
    assert.equal(publisher.messages.length, 0);
  }));

test("POST /orders rejects an unsupported currency without publishing", () =>
  withServer(async (url, publisher) => {
    const res = await post(url, { customerEmail: "ana@example.com", currency: "USD", items: [{ sku: "X", quantity: 1, unitPriceCents: 100 }] });

    assert.equal(res.status, 400);
    assert.equal(publisher.messages.length, 0);
  }));

test("GET /orders/:id returns a created order", () =>
  withServer(async (url) => {
    await post(url, { customerEmail: "ana@example.com", items: [{ sku: "X", quantity: 1, unitPriceCents: 100 }] });
    const res = await fetch(`${url}/orders/o-1`);

    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as { totalCents: number }).totalCents, 100);
  }));

test("GET /orders/:id returns 404 for an unknown order", () =>
  withServer(async (url) => {
    assert.equal((await fetch(`${url}/orders/nope`)).status, 404);
  }));
