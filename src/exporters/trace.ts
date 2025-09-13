import { ProtobufTraceSerializer } from "@opentelemetry/otlp-transformer";
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import { MessageTypes } from "~types";
import { consoleProxy } from "~utils/logging";

export class TraceExporter implements SpanExporter {

    constructor(private sessionId: string) {
        consoleProxy.debug('TraceExporter created with sessionId:', sessionId);
    }

    async shutdown(): Promise<void> {
        // No resources to clean up in this test exporter
        consoleProxy.debug('TraceExporter shutdown called.');
        return Promise.resolve();
    }

    async forceFlush(): Promise<void> {
        // No buffering, so nothing to flush
        consoleProxy.debug('TraceExporter forceFlush called.');
        return Promise.resolve();
    }

    async export(spans: ReadableSpan[], resultCallback: (result: { code: number; error?: Error }) => void
    ): Promise<void> {
        // Log the spans for testing purposes
        consoleProxy.debug('Exporting spans:', spans);

        const bytes = ProtobufTraceSerializer.serializeRequest(spans);

        if (bytes) {
            const message = { bytes: Array.from(bytes), type: MessageTypes.OTLPTraceMessage }
            const key = `${this.sessionId}:relay-to-background`
            const event = new CustomEvent(key, { detail: message })
            consoleProxy.debug(`message sent to relay using session id: ${this.sessionId}`, message)
            // Our `ISOLATED` content script will forward this event to the background script
            window.dispatchEvent(event)
            resultCallback({ code: 0 })
        } else {
            resultCallback({ code: 1, error: new Error('failed to serialize spans') })
        }
    }
}