# orders-api

This repo is part of the Brewly ecosystem. The shared rules, the system map and the
specs live in ../AGENTS.md, ../docs/ and ../openspec/. Start the agent from the ecosystem
root, not from inside this repo.

Creates orders over HTTP and publishes `orders.created`. That event is a contract with
notifier and invoicing: read ../docs/system-map.md before changing it.

## Commands

- Install: `npm install` (only needed for lint; tests run with plain Node 22)
- Tests: `npm test` (single test: `node --test test/order.test.ts`)
- Lint: `npm run lint` (type check with `tsc --noEmit`)
- Build: none: Node runs the TypeScript sources directly
- Run: `npm start` (port 3000; `BREWLY_QUEUE_DIR` sets the queue folder)

## Conventions

- No runtime dependencies: `node:http`, `node:test`, `node:fs`. Do not add a framework.
- Only erasable TypeScript (no enums, namespaces or parameter properties): Node strips the
  types without compiling. Relative imports end in `.ts`.
- Money is always an integer number of cents. Never use floats for amounts.

## Do not touch without asking

- `src/events.ts`: the payload of `orders.created` is a cross-repo contract.
