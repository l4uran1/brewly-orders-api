# Brewly · orders-api

Creates coffee orders and publishes `orders.created`.

Part of [agent-ecosystem-demo](https://github.com/l4uran1/agent-ecosystem-demo), a demo of
[agent-ecosystem](https://github.com/l4uran1/agent-ecosystem): clone that repo and run
`./bootstrap.sh` to get every Brewly service side by side.

```bash
npm start
curl -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d '{"customerEmail":"ana@example.com","items":[{"sku":"ETHIOPIA-250G","quantity":2,"unitPriceCents":1250}]}'
```

| Endpoint | |
| --- | --- |
| `POST /orders` | Creates an order and publishes `orders.created` |
| `GET /orders/:id` | Returns an order |
| `GET /health` | Health check |

Requires Node 22.18 or later. No runtime dependencies.
