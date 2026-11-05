import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface Publisher {
  publish(topic: string, payload: object): void;
}

/**
 * Local stand-in for a message broker: one JSON line per message in <dir>/<topic>.jsonl.
 * Delivery is at-least-once: consumers must be idempotent.
 */
export class FileQueuePublisher implements Publisher {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  publish(topic: string, payload: object): void {
    appendFileSync(join(this.dir, `${topic}.jsonl`), JSON.stringify(payload) + "\n");
  }
}

export class InMemoryPublisher implements Publisher {
  readonly messages: { topic: string; payload: object }[] = [];

  publish(topic: string, payload: object): void {
    this.messages.push({ topic, payload });
  }
}
