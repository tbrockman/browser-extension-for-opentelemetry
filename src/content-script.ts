import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import {
    LoggerProvider,
    SimpleLogRecordProcessor
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { SimpleSpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { OTLPProtoExporterBrowserBase, getExportRequestProto } from '@opentelemetry/otlp-proto-exporter-base';
import { OTLPExporterError } from '@opentelemetry/otlp-exporter-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_TELEMETRY_SDK_LANGUAGE, SEMRESATTRS_TELEMETRY_SDK_NAME, SEMRESATTRS_TELEMETRY_SDK_VERSION } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { MessageTypes } from '~types';
import { consoleProxy } from '~utils/logging';
import { wrapConsoleWithLoggerProvider } from '~telemetry/logs';
import type { LocalStorageType } from '~utils/options';
import { deserializer } from '~utils/serde';

function createSendOverride<ExportItem, ServiceRequest>(sessionId: string, exporter: OTLPProtoExporterBrowserBase<ExportItem, ServiceRequest>, type: MessageTypes) {

    return (objects: ExportItem[], onSuccess: () => void, onError: (error: OTLPExporterError) => void) => {

        if (objects.length === 0) {
            return onSuccess()
        }
        const serviceRequest = exporter.convert(objects)
        const clientType = exporter.getServiceClientType()
        const exportRequestType = getExportRequestProto(clientType)
        const otlp = exportRequestType.create(serviceRequest)

        if (otlp) {
            const bytes = exportRequestType.encode(otlp).finish();
            // Because messages are JSON serialized and deserialized, we can't send a Uint8Array directly
            // So we send an array of numbers and convert it back to a Uint8Array on the other side
            const message = { bytes: Array.from(bytes), timeout: exporter.timeoutMillis, type }
            const key = `${sessionId}:relay-to-background`
            const event = new CustomEvent(key, { detail: message })
            // Our `ISOLATED` content script will forward this event to the background script
            window.dispatchEvent(event)
            consoleProxy.debug(`message sent to relay using session id: ${sessionId}`, message)
            onSuccess()
        } else {
            onError(new OTLPExporterError('failed to create OTLP proto service request message'))
        }
    }
}

const instrument = (sessionId: string, options: LocalStorageType) => {

    if (!options || !options.enabled || !options.instrumentations || options.instrumentations.length === 0 || window.__OTEL_BROWSER_EXT_INSTRUMENTED__) {
        consoleProxy.debug(`not instrumenting as either options missing or already instrumented`, options, window.__OTEL_BROWSER_EXT_INSTRUMENTED__)
        return () => { }
    }
    window.__OTEL_BROWSER_EXT_INSTRUMENTED__ = true
    consoleProxy.debug(`instrumenting`, { sessionId, options })

    const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: 'browser-extension-for-opentelemetry',
        [SEMRESATTRS_SERVICE_VERSION]: '0.0.10', // TODO: replace with package.json version
        [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: 'webjs',
        [SEMRESATTRS_TELEMETRY_SDK_NAME]: 'opentelemetry',
        [SEMRESATTRS_TELEMETRY_SDK_VERSION]: '1.22.0', // TODO: replace with resolved version
        // 'browser.name': process.env.PLASMO_BROWSER, // TODO: fix why this is undefined
        'extension.session.id': sessionId,
        ...Object.fromEntries(options.attributes.entries())
    })

    let tracerProvider: WebTracerProvider

    if (options.tracingEnabled) {
        tracerProvider = new WebTracerProvider({
            resource,
        })
        const traceExporter = new OTLPTraceExporter({
            url: options.traceCollectorUrl,
            headers: Object.fromEntries(options.headers.entries()),
            concurrencyLimit: options.concurrencyLimit,
        })
        // @ts-ignore
        traceExporter.send = createSendOverride(sessionId, traceExporter, MessageTypes.OTLPTraceMessage)
        // TODO: make batching configurable, choosing simple for now to avoid losing data on page navigations
        const traceProcessor = new SimpleSpanProcessor(traceExporter);
        tracerProvider.addSpanProcessor(traceProcessor);
        tracerProvider.register({
            contextManager: new ZoneContextManager(),
            propagator: new CompositePropagator({
                propagators: options.propagateTo.length > 0 ? [
                    new B3Propagator(),
                    new W3CTraceContextPropagator(),
                ] : [],
            }),
        })
    }

    let loggerProvider: LoggerProvider

    if (options.loggingEnabled) {
        const logExporter = new OTLPLogExporter({
            url: options.logCollectorUrl,
            headers: Object.fromEntries(options.headers.entries()),
            concurrencyLimit: options.concurrencyLimit,
        })
        // @ts-ignore
        logExporter.send = createSendOverride(sessionId, logExporter, MessageTypes.OTLPLogMessage)
        loggerProvider = new LoggerProvider({
            resource
        })
        // TODO: make batching configurable, choosing simple for now to avoid losing data on page navigations
        loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter))
        wrapConsoleWithLoggerProvider(loggerProvider)
    }
    const propagateTraceHeaderCorsUrls = options.propagateTo.map((url) => new RegExp(url))
    const clearTimingResources = true
    const instrumentations = {
        load: [
            ['@opentelemetry/instrumentation-document-load', {}]
        ],
        fetch: [
            ['@opentelemetry/instrumentation-xml-http-request', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls,
                // TODO: implement so we can abandon the related instrumentation patches
                // applyCustomAttributesOnSpan: async (span: Span, xhr: XMLHttpRequest) => {
                //     if (xhr.status >= 400) {
                //         span.setStatus({ code: 2, message: xhr.statusText })
                //     }
                // }
            }],
            ['@opentelemetry/instrumentation-fetch', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls,
                // TODO: implement so we can abandon the related instrumentation patches
                // applyCustomAttributesOnSpan: async (span: Span, request: Request | RequestInit, response: Response | FetchError) => {
                //     if ('message' in response) {
                //         span.setStatus({ code: 2, message: response.message })
                //     }
                // },
            }]
        ],
        interaction: [
            ['@opentelemetry/instrumentation-user-interaction', {
                eventNames: options.events,
            }]
        ],
    }
    const instrumentationsToRegister = {}
    options.instrumentations.forEach((instrumentation: string) => {
        instrumentations[instrumentation].forEach((setting) => {
            instrumentationsToRegister[setting[0]] = setting[1]
        })
    })
    consoleProxy.debug(`registering instrumentations`, instrumentationsToRegister)
    const deregister = registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations(instrumentationsToRegister),
        ],
        tracerProvider,
        loggerProvider,
    });

    return () => {
        consoleProxy.log(`deregistering instrumentations`)
        window.__OTEL_BROWSER_EXT_INSTRUMENTED__ = false
        return deregister()
    }
}

export type InjectContentScriptArgs = {
    sessionId: string,
    options: LocalStorageType | string,
    retries?: number,
    backoff?: number,
}

export default function injectContentScript({ sessionId, options, retries = 10, backoff = 10 }: InjectContentScriptArgs) {
    if (retries <= 0) {
        return
    }

    try {
        if (typeof options === 'string') {
            options = deserializer<LocalStorageType>(options)
        }
        let deregisterInstrumentation = instrument(sessionId, options);

        const key = `${sessionId}:relay-from-background`
        const listener = (event: CustomEvent) => {
            try {
                if (event.detail.type === 'disconnect') {
                    consoleProxy.debug(`received disconnect message from relay`, event.detail)
                    deregisterInstrumentation && deregisterInstrumentation()
                    window.removeEventListener(key, listener)
                } else if (event.detail.type === 'storageChanged') {
                    consoleProxy.debug(`received storage changed message from relay`, event.detail)
                    options = {
                        ...options as LocalStorageType,
                        ...event.detail.data as Partial<LocalStorageType>
                    }
                    deregisterInstrumentation && deregisterInstrumentation()
                    deregisterInstrumentation = instrument(sessionId, options)
                }
            } catch (e) {
                consoleProxy.error(`error handling message from relay`, e, event)
            }
        }

        // listen for messages from the relay
        window.addEventListener(key, listener)
    } catch (e) {
        consoleProxy.error(`error injecting content script`, e, options)
        setTimeout(() => {
            consoleProxy.debug(`attempting to reconnect in ${backoff} ms`)
            injectContentScript({ sessionId, options, retries: retries - 1, backoff: backoff * 2 })
        }, backoff)
    }
}
