import { buildServer } from "./server.ts";
import { FileQueuePublisher } from "./queue.ts";

const port = Number(process.env.PORT ?? 3000);
const queueDir = process.env.BREWLY_QUEUE_DIR ?? "/tmp/brewly-queue";

buildServer({ publisher: new FileQueuePublisher(queueDir) }).listen(port, () => {
  console.log(`orders-api listening on http://localhost:${port} (queue: ${queueDir})`);
});
