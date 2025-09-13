import { ProtobufLogsSerializer } from "@opentelemetry/otlp-transformer";
import type { LogRecordExporter, ReadableLogRecord } from "@opentelemetry/sdk-logs";
import { MessageTypes } from "~types";
import { consoleProxy } from "~utils/logging";

export class LogExporter implements LogRecordExporter {

    constructor(private sessionId: string) {
        consoleProxy.debug('LogExporter created with sessionId:', sessionId);
    }

    async shutdown(): Promise<void> {
        // No resources to clean up in this log exporter
        consoleProxy.debug('LogExporter shutdown called.');
        return Promise.resolve();
    }

    async forceFlush(): Promise<void> {
        // No buffering, so nothing to flush
        consoleProxy.debug('LogExporter forceFlush called.');
        return Promise.resolve();
    }

    async export(logs: ReadableLogRecord[], resultCallback: (result: { code: number; error?: Error }) => void
    ): Promise<void> {
        // Log the spans for testing purposes
        consoleProxy.debug('Exporting logs:', logs);

        const bytes = ProtobufLogsSerializer.serializeRequest(logs);

        if (bytes) {
            const message = { bytes: Array.from(bytes), type: MessageTypes.OTLPLogMessage }
            const key = `${this.sessionId}:relay-to-background`
            const event = new CustomEvent(key, { detail: message })
            consoleProxy.debug(`message sent to relay using session id: ${this.sessionId}`, message)
            // Our `ISOLATED` content script will forward this event to the background script
            window.dispatchEvent(event)
            resultCallback({ code: 0 })
        } else {
            resultCallback({ code: 1, error: new Error('failed to serialize logs') })
        }
    }
}