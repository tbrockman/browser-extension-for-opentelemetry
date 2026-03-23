import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test';
import { createServer, type Server, type IncomingMessage } from 'http';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '..', 'build', 'chrome-mv3-prod');

export type CollectedRequest = {
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};

export type MockCollector = {
  port: number;
  requests: CollectedRequest[];
  waitForRequest: (urlPath: string, timeout?: number) => Promise<CollectedRequest>;
};

/**
 * Creates a minimal HTTP server that accepts OTLP proto exports and records them.
 */
function createMockCollector(port: number): Promise<{ server: Server; collector: MockCollector }> {
  return new Promise((resolve, reject) => {
    const requests: CollectedRequest[] = [];
    const waiters: { urlPath: string; resolve: (req: CollectedRequest) => void; reject: (err: Error) => void }[] = [];

    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const collected: CollectedRequest = {
          url: req.url ?? '',
          method: req.method ?? '',
          headers: req.headers,
          body: Buffer.concat(chunks),
        };
        requests.push(collected);

        // Resolve any waiters matching this URL path
        for (let i = waiters.length - 1; i >= 0; i--) {
          if (collected.url.includes(waiters[i].urlPath)) {
            waiters[i].resolve(collected);
            waiters.splice(i, 1);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      });
    });

    server.on('error', reject);
    server.listen(port, () => {
      resolve({
        server,
        collector: {
          port,
          requests,
          waitForRequest(urlPath: string, timeout = 15_000): Promise<CollectedRequest> {
            // Check if we already have a matching request
            const existing = requests.find(r => r.url.includes(urlPath));
            if (existing) return Promise.resolve(existing);

            return new Promise((res, rej) => {
              const timer = setTimeout(() => {
                rej(new Error(`Timed out waiting for request to ${urlPath} after ${timeout}ms`));
              }, timeout);
              waiters.push({
                urlPath,
                resolve: (req) => { clearTimeout(timer); res(req); },
                reject: rej,
              });
            });
          },
        },
      });
    });
  });
}

/**
 * Creates a simple HTTP server that serves a test HTML page on localhost.
 */
function createTestPageServer(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const html = `<!DOCTYPE html>
<html>
<head><title>OTEL Test Page</title></head>
<body>
  <h1>Test Page</h1>
  <button id="test-btn">Click me</button>
  <script>
    document.getElementById('test-btn').addEventListener('click', () => {
      document.title = 'clicked';
    });
  </script>
</body>
</html>`;

    const server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });

    server.on('error', reject);
    server.listen(port, () => resolve(server));
  });
}

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
  collector: MockCollector;
  testPageUrl: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  collector: async ({}, use) => {
    const { server, collector } = await createMockCollector(4318);
    await use(collector);
    server.close();
  },

  // eslint-disable-next-line no-empty-pattern
  testPageUrl: async ({}, use) => {
    const port = 3456;
    const server = await createTestPageServer(port);
    await use(`http://localhost:${port}`);
    server.close();
  },

  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    await use(sw);
  },

  extensionId: async ({ serviceWorker }, use) => {
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
