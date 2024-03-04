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
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_TELEMETRY_SDK_LANGUAGE, SEMRESATTRS_TELEMETRY_SDK_NAME, SEMRESATTRS_TELEMETRY_SDK_VERSION } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { MessageTypes, type Options, type PortMessage, type TypedPort } from '~types';
import { consoleProxy } from '~util';


function createSendOverride<ExportItem, ServiceRequest>(port: TypedPort<PortMessage, Partial<Options>>, exporter: OTLPProtoExporterBrowserBase<ExportItem, ServiceRequest>) {

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

const instrument = (port: TypedPort<PortMessage, Partial<Options>>, options: Options) => {

    if (!options.enabled || options.instrumentations.length === 0) {
        return () => { }
    }
    consoleProxy.debug(`instrumenting with options`, options)

    const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: 'opentelemetry-browser-extension',
        [SEMRESATTRS_SERVICE_VERSION]: '0.0.3',
        [SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: 'webjs',
        [SEMRESATTRS_TELEMETRY_SDK_NAME]: 'opentelemetry',
        [SEMRESATTRS_TELEMETRY_SDK_VERSION]: '1.19.0',
        'browser.language': navigator.language,
        'user_agent.original': navigator.userAgent,
        'extension.target': process.env.PLASMO_TARGET,
    })

    let tracerProvider;

    if (options.tracingEnabled) {
        tracerProvider = new WebTracerProvider({
            resource,
        });
        // #TODO: make console configurable for debugging
        // const consoleExporter = new ConsoleSpanExporter();
        // const consoleProcessor = new SimpleSpanProcessor(consoleExporter);
        // provider.addSpanProcessor(consoleProcessor);
        const traceExporter = new OTLPTraceExporter({
            url: options.traceCollectorUrl,
            headers: options.headers,
            concurrencyLimit: options.concurrencyLimit,
        });
        // @ts-ignore
        traceExporter.send = createSendOverride(port, traceExporter)
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

    let loggerProvider;
    if (options.loggingEnabled) {
        const logExporter = new OTLPLogExporter({
            url: options.logCollectorUrl,
            headers: options.headers,
            concurrencyLimit: options.concurrencyLimit,
        });
        // @ts-ignore
        logExporter.send = createSendOverride(port, logExporter)
        loggerProvider = new LoggerProvider();
        loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

        const logger = loggerProvider.getLogger('default', resource.attributes[SEMRESATTRS_SERVICE_VERSION].toString());
        logger.emit({
            severityNumber: SeverityNumber.DEBUG,
            severityText: 'debug',
            body: 'open-telemetry-browser-extension log exporter initialized',
            attributes: {},
        });
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

    return registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations(instrumentationsToRegister),
        ],
        tracerProvider,
        loggerProvider,
    });
}

function injectContentScript(extensionId: string, options: Options) {
    const port: TypedPort<PortMessage, Partial<Options>> = chrome.runtime.connect(extensionId);
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