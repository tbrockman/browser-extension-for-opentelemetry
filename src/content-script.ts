import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { SeverityNumber } from '@opentelemetry/api-logs';
import {
    LoggerProvider,
    BatchLogRecordProcessor,
    type ReadableLogRecord,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { BatchSpanProcessor, type ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { OTLPProtoExporterBrowserBase, getExportRequestProto } from '@opentelemetry/otlp-proto-exporter-base';
import { OTLPExporterError, type OTLPExporterConfigBase } from '@opentelemetry/otlp-exporter-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { MessageTypes, type TypedPort } from '~types';
import { consoleProxy } from '~util';

export type Options = {
    traceCollectorUrl: string
    logCollectorUrl: string
    headers: Record<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    telemetry: ('logs' | 'traces')[],
    propagateTo: string[],
    instrumentations: ('fetch' | 'load' | 'interaction')[],
    enabled: boolean,
}

type OTLPBrowserExtensionExporterConfigBase = {
    port: TypedPort
} & OTLPExporterConfigBase

export abstract class OTLPBrowserExtensionExporter<ExportItem, ServiceRequest> extends OTLPProtoExporterBrowserBase<ExportItem, ServiceRequest> {
    port: TypedPort

    constructor({ port, ...config }: OTLPBrowserExtensionExporterConfigBase) {
        super(config);
        this.port = port
    }

    override send(
        objects: ExportItem[],
        onSuccess: () => void,
        onError: (error: OTLPExporterError) => void
    ) {
        const serviceRequest = this.convert(objects);
        const clientType = this.getServiceClientType()
        const exportRequestType = getExportRequestProto(clientType)
        const otlp = exportRequestType.create(serviceRequest);

        if (otlp) {
            const bytes = exportRequestType.encode(otlp).finish();
            // Because messages are JSON serialized and deserialized, we can't send a Uint8Array directly
            // So we send an array of numbers and convert it back to a Uint8Array on the other side
            const message = { bytes: Array.from(bytes), timeout: this.timeoutMillis, type: MessageTypes.OTLPSendMessage }
            consoleProxy.debug(`message sent to background script to forward to collector`)
            this.port.postMessage(message)
            onSuccess()
        } else {
            onError(new OTLPExporterError('failed to create OTLP proto service request message'))
        }
    }
}

function createSendOverride<ExportItem, ServiceRequest>(port: TypedPort, exporter: OTLPProtoExporterBrowserBase<ExportItem, ServiceRequest>) {

    return (objects: ExportItem[], onSuccess: () => void, onError: (error: OTLPExporterError) => void) => {
        const serviceRequest = exporter.convert(objects);
        const clientType = exporter.getServiceClientType()
        const exportRequestType = getExportRequestProto(clientType)
        const otlp = exportRequestType.create(serviceRequest);

        if (otlp) {
            const bytes = exportRequestType.encode(otlp).finish();
            // Because messages are JSON serialized and deserialized, we can't send a Uint8Array directly
            // So we send an array of numbers and convert it back to a Uint8Array on the other side
            const message = { bytes: Array.from(bytes), timeout: exporter.timeoutMillis, type: MessageTypes.OTLPSendMessage }
            consoleProxy.debug(`message sent to background script to forward to collector`)
            port.postMessage(message)
            onSuccess()
        } else {
            onError(new OTLPExporterError('failed to create OTLP proto service request message'))
        }
    }
}

const instrument = (port: TypedPort, options: Options) => {

    if (!options.enabled || options.instrumentations.length === 0) {
        return () => { }
    }
    consoleProxy.debug(`instrumenting with options`, options)

    const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'opentelemetry-browser-extension',
        [SemanticResourceAttributes.SERVICE_VERSION]: '0.0.3',
        [SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE]: 'webjs',
        [SemanticResourceAttributes.TELEMETRY_SDK_NAME]: 'opentelemetry',
        [SemanticResourceAttributes.TELEMETRY_SDK_VERSION]: '1.19.0',
        'browser.language': navigator.language,
        'user_agent.original': navigator.userAgent,
        'extension.target': process.env.PLASMO_TARGET,
    })
    const provider = new WebTracerProvider({
        resource,
    });
    // #TODO: make console configurable
    // const consoleExporter = new ConsoleSpanExporter();
    const traceExporter = new OTLPTraceExporter({
        url: options.traceCollectorUrl,
        headers: options.headers,
        concurrencyLimit: options.concurrencyLimit,
    });
    // @ts-ignore
    traceExporter.send = createSendOverride(port, traceExporter)

    const logExporter = new OTLPLogExporter({
        url: options.logCollectorUrl,
        headers: options.headers,
        concurrencyLimit: options.concurrencyLimit,
    });
    // @ts-ignore
    logExporter.send = createSendOverride(port, logExporter)
    const loggerProvider = new LoggerProvider();
    loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

    const logger = loggerProvider.getLogger('default', '1.0.0');
    // Emit a log
    logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'info',
        body: 'this is a log body',
        attributes: { 'log.type': 'custom' },
    });
    const traceProcessor = new BatchSpanProcessor(traceExporter);
    // const consoleProcessor = new SimpleSpanProcessor(consoleExporter);
    // provider.addSpanProcessor(consoleProcessor);
    provider.addSpanProcessor(traceProcessor);
    provider.register({
        contextManager: new ZoneContextManager(),
        propagator: new CompositePropagator({
            propagators: options.propagateTo.length > 0 ? [
                new B3Propagator(),
                new W3CTraceContextPropagator(),
            ] : [],
        }),
    });
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

    return registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations(instrumentationsToRegister),
        ],
        tracerProvider: provider,
    });
}

function injectContentScript(extensionId: string, options: Options) {
    const port = chrome.runtime.connect(extensionId);
    let deregisterInstrumentation = instrument(port, options);

    port.onDisconnect.addListener(obj => {
        consoleProxy.debug(`disconnected port`, obj);
        deregisterInstrumentation && deregisterInstrumentation()
        port.disconnect()
        // try to reconnect if possible
        injectContentScript(extensionId, options)
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
}

export default injectContentScript;