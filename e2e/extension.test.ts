import { test, expect } from './fixtures';

/**
 * Helper to set extension config via the service worker.
 * Values are JSON-serialized to match the extension's internal storage format
 * (see src/utils/serde.ts and src/storage/local/index.ts).
 */
async function setExtensionStorage(
  serviceWorker: import('@playwright/test').Worker,
  data: Record<string, unknown>,
) {
  await serviceWorker.evaluate(async (entries) => {
    const serialized: Record<string, string> = {};
    for (const [key, value] of Object.entries(entries)) {
      serialized[key] = JSON.stringify(value, (_, v) => {
        // Match the extension's Map serialization format
        if (v instanceof Map) {
          return { dataType: 'Map', value: Array.from(v.entries()) };
        }
        return v;
      });
    }
    await chrome.storage.local.set(serialized);
  }, data);
}

test('extension instruments a page and exports traces to the configured collector', async ({
  context,
  serviceWorker,
  collector,
  testPageUrl,
}) => {
  // Configure the extension to point at our mock collector
  // The default matchPatterns already includes http://localhost/* which covers our test page
  await setExtensionStorage(serviceWorker, {
    traceCollectorUrl: `http://localhost:${collector.port}/v1/traces`,
    logCollectorUrl: `http://localhost:${collector.port}/v1/logs`,
    enabled: true,
    tracingEnabled: true,
    loggingEnabled: true,
    instrumentations: ['load', 'fetch', 'interaction'],
    matchPatterns: ['http://localhost/*'],
    headers: { dataType: 'Map', value: [] },
    attributes: { dataType: 'Map', value: [['test.run', 'e2e']] },
    propagateTo: [],
    events: ['click'],
    concurrencyLimit: 50,
  });

  // Navigate to our test page - this triggers the extension's tab.onUpdated listener
  // which injects the content script and relay
  const page = await context.newPage();
  await page.goto(testPageUrl, { waitUntil: 'load' });

  // The document-load instrumentation should generate trace spans
  // Wait for the trace export request to arrive at our mock collector
  const traceRequest = await collector.waitForRequest('/v1/traces');

  expect(traceRequest.method).toBe('POST');
  expect(traceRequest.headers['content-type']).toBe('application/x-protobuf');
  expect(traceRequest.body.length).toBeGreaterThan(0);

  await page.close();
});

test('extension exports logs when console methods are called', async ({
  context,
  serviceWorker,
  collector,
  testPageUrl,
}) => {
  await setExtensionStorage(serviceWorker, {
    traceCollectorUrl: `http://localhost:${collector.port}/v1/traces`,
    logCollectorUrl: `http://localhost:${collector.port}/v1/logs`,
    enabled: true,
    tracingEnabled: true,
    loggingEnabled: true,
    instrumentations: ['load', 'fetch', 'interaction'],
    matchPatterns: ['http://localhost/*'],
    headers: { dataType: 'Map', value: [] },
    attributes: { dataType: 'Map', value: [['test.run', 'e2e']] },
    propagateTo: [],
    events: ['click'],
    concurrencyLimit: 50,
  });

  const page = await context.newPage();
  await page.goto(testPageUrl, { waitUntil: 'load' });

  // Wait for the content script to inject and set up instrumentation
  // (the content script sets window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ when ready)
  await page.waitForFunction(
    () => window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ !== undefined,
    { timeout: 10_000 },
  );

  // Trigger a console.log on the page - the extension wraps console methods
  // to emit log records via OTLP
  await page.evaluate(() => {
    console.log('e2e-test-log-message');
  });

  const logRequest = await collector.waitForRequest('/v1/logs');

  expect(logRequest.method).toBe('POST');
  expect(logRequest.headers['content-type']).toBe('application/x-protobuf');
  expect(logRequest.body.length).toBeGreaterThan(0);

  await page.close();
});
