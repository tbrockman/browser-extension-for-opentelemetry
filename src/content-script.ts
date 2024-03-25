import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import {
    LoggerProvider,
    BatchLogRecordProcessor
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPProtoExporterBrowserBase, getExportRequestProto } from '@opentelemetry/otlp-proto-exporter-base';
import { OTLPExporterError } from '@opentelemetry/otlp-exporter-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_TELEMETRY_SDK_LANGUAGE, SEMRESATTRS_TELEMETRY_SDK_NAME, SEMRESATTRS_TELEMETRY_SDK_VERSION } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { MessageTypes, type Options, type PortMessage, type TypedPort } from '~types';
import { consoleProxy, wrapConsoleWithLoggerProvider } from '~util';


function createSendOverride<ExportItem, ServiceRequest>(port: TypedPort<PortMessage, Partial<Options>>, exporter: OTLPProtoExporterBrowserBase<ExportItem, ServiceRequest>, type: MessageTypes) {

    return (objects: ExportItem[], onSuccess: () => void, onError: (error: OTLPExporterError) => void) => {

        if (objects.length === 0) {
            onSuccess()
            return
        }
        const serviceRequest = exporter.convert(objects);
        const clientType = exporter.getServiceClientType()
        const exportRequestType = getExportRequestProto(clientType)
        const otlp = exportRequestType.create(serviceRequest);

        if (otlp) {
            const bytes = exportRequestType.encode(otlp).finish();
            // Because messages are JSON serialized and deserialized, we can't send a Uint8Array directly
            // So we send an array of numbers and convert it back to a Uint8Array on the other side
            const message = { bytes: Array.from(bytes), timeout: exporter.timeoutMillis, type }
            consoleProxy.debug(`message sent to background script to forward to collector`)
            port.postMessage(message)
            onSuccess()
        } else {
            onError(new OTLPExporterError('failed to create OTLP proto service request message'))
        }
    }
}

const instrument = (port: TypedPort<PortMessage, Partial<Options>>, options: Options) => {
    if (!options || !options.enabled || !options.instrumentations || options.instrumentations.length === 0 || window.__OTEL_BROWSER_EXT_INSTRUMENTED__) {
        consoleProxy.debug(`not instrumenting`, options, window.__OTEL_BROWSER_EXT_INSTRUMENTED__)
        return () => { }
    }
    window.__OTEL_BROWSER_EXT_INSTRUMENTED__ = true
    consoleProxy.debug(`instrumenting with options`, options)

    const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: 'opentelemetry-browser-extension',
        [SEMRESATTRS_SERVICE_VERSION]: '0.0.5', // TODO: replace with package.json version
        [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: 'webjs',
        [SEMRESATTRS_TELEMETRY_SDK_NAME]: 'opentelemetry',
        [SEMRESATTRS_TELEMETRY_SDK_VERSION]: '1.22.0', // TODO: replace with resolved version
        'browser.language': navigator.language,
        'user_agent.original': navigator.userAgent,
        'extension.target': process.env.PLASMO_TARGET,
    })

    let tracerProvider: WebTracerProvider;

    if (options.tracingEnabled) {
        tracerProvider = new WebTracerProvider({
            resource,
        });
        const traceExporter = new OTLPTraceExporter({
            url: options.traceCollectorUrl,
            headers: options.headers,
            concurrencyLimit: options.concurrencyLimit,
        });
        // @ts-ignore
        traceExporter.send = createSendOverride(port, traceExporter, MessageTypes.OTLPTraceMessage)
        const traceProcessor = new BatchSpanProcessor(traceExporter);
        tracerProvider.addSpanProcessor(traceProcessor);
        tracerProvider.register({
            contextManager: new ZoneContextManager(),
            propagator: new CompositePropagator({
                propagators: options.propagateTo.length > 0 ? [
                    new B3Propagator(),
                    new W3CTraceContextPropagator(),
                ] : [],
            }),
        });
    }

    let loggerProvider: LoggerProvider;
    if (options.loggingEnabled) {
        const logExporter = new OTLPLogExporter({
            url: options.logCollectorUrl,
            headers: options.headers,
            concurrencyLimit: options.concurrencyLimit,
        });
        // @ts-ignore
        logExporter.send = createSendOverride(port, logExporter, MessageTypes.OTLPLogMessage)
        loggerProvider = new LoggerProvider({
            resource
        });
        loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
        wrapConsoleWithLoggerProvider(loggerProvider);
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
                propagateTraceHeaderCorsUrls
            }],
            ['@opentelemetry/instrumentation-fetch', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls
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

    const deregister = registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations(instrumentationsToRegister),
        ],
        tracerProvider,
        loggerProvider,
    });

    return () => {
        window.__OTEL_BROWSER_EXT_INSTRUMENTED__ = false
        tracerProvider.shutdown()
        loggerProvider.shutdown()
        return deregister()
    }
}

function injectContentScript(extensionId: string, options: Options, retries = 10, backoff = 10) {
    if (retries <= 0) {
        return
    }

    try {
        if (!chrome.runtime) {
            consoleProxy.debug(`chrome.runtime not available, not injecting content script`)
            return
        }
        const port: TypedPort<PortMessage, Partial<Options>> = chrome.runtime.connect(extensionId);
        let deregisterInstrumentation = instrument(port, options);

        port.onDisconnect.addListener(obj => {
            consoleProxy.debug(`disconnected port`, obj);
            deregisterInstrumentation && deregisterInstrumentation()
            port.disconnect()
            // try to reconnect if possible
            setTimeout(() => {
                consoleProxy.debug(`attempting to reconnect in ${backoff}ms`)
                injectContentScript(extensionId, options, retries - 1, backoff * 2)
            }, backoff)
        })

        port.onMessage.addListener((m) => {
            consoleProxy.debug(`received message from background script`, m);
            options = {
                ...options,
                ...m
            }
            deregisterInstrumentation && deregisterInstrumentation()
            deregisterInstrumentation = instrument(port, options)
        });
    } catch (e) {
        consoleProxy.error(`error injecting content script`, e)
        setTimeout(() => {
            consoleProxy.debug(`attempting to reconnect in ${backoff}ms`)
            injectContentScript(extensionId, options, retries - 1, backoff * 2)
        }, backoff)
    }
}

export default injectContentScript;