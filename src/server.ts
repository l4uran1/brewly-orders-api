import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { createOrder, parseNewOrder, ValidationError, type Order } from "./order.ts";
import { ORDERS_CREATED, toOrderCreated } from "./events.ts";
import type { Publisher } from "./queue.ts";

export type Deps = {
  publisher: Publisher;
  newId?: () => string;
  now?: () => Date;
};

export function buildServer({ publisher, newId = randomUUID, now = () => new Date() }: Deps): Server {
  const orders = new Map<string, Order>();

  return createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true });

      if (req.method === "POST" && req.url === "/orders") {
        const order = createOrder(parseNewOrder(await readJson(req)), newId(), now());
        orders.set(order.id, order);
        publisher.publish(ORDERS_CREATED, toOrderCreated(order));
        return send(res, 201, order);
      }

      const match = req.method === "GET" ? req.url?.match(/^\/orders\/([^/]+)$/) : null;
      if (match) {
        const order = orders.get(match[1]);
        return order ? send(res, 200, order) : send(res, 404, { error: "order not found" });
      }

      send(res, 404, { error: "not found" });
    } catch (err) {
      if (err instanceof ValidationError || err instanceof SyntaxError) return send(res, 400, { error: err.message });
      send(res, 500, { error: "internal error" });
    }
  });
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
