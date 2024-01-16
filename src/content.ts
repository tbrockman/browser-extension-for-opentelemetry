import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    world: "MAIN",
    run_at: "document_start"
}

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { config as appConfig } from "~config";

let options = {
    url: 'http://localhost:4318/v1/traces', // url is optional and can be omitted - default is http://localhost:4318/v1/traces
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
    events: ['submit', 'click', 'keypress', 'scroll'] as (keyof HTMLElementEventMap)[], // an optional array of event names to be instrumented
    telemetry: ['logs', 'traces'],
    propagateTo: [],
    instrumentations: ['fetch', 'load', 'interaction'],
    enabled: true,
};
let deregisterInstrumentation

const instrument = () => {

    console.debug('instrumenting with options', options)

    if (deregisterInstrumentation) {
        console.debug('deregistering existing instrumentation')
        deregisterInstrumentation()
    }

    if (!options.enabled || options.instrumentations.length === 0) {
        return
    }

    const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'opentelemetry-browser-extension',
        [SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
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
        url: options.url,
        headers: options.headers,
        concurrencyLimit: options.concurrencyLimit,
    });
    // #TODO: instrument console logs
    // const log = new OTLPLogExporter({
    //     url: options.url,
    //     headers: options.headers,
    //     concurrencyLimit: options.concurrencyLimit,
    // });
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
        'load': [
            ['@opentelemetry/instrumentation-document-load', {}]
        ],
        'fetch': [
            ['@opentelemetry/instrumentation-xml-http-request', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls
            }],
            ['@opentelemetry/instrumentation-fetch', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls
            }]
        ],
        'interaction': [
            ['@opentelemetry/instrumentation-user-interaction', {
                eventNames: options.events,
            }]
        ],
    }
    const instrumentationsToRegister = {}
    options.instrumentations.forEach((instrumentation) => {
        instrumentations[instrumentation].forEach((instrumentation) => {
            instrumentationsToRegister[instrumentation[0]] = instrumentation[1]
        })
    })

    deregisterInstrumentation = registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations(instrumentationsToRegister),
        ],
        tracerProvider: provider,
    });
}

let port = chrome.runtime.connect(appConfig.extension.id);

console.debug('extension id', appConfig.extension.id)

port.onDisconnect.addListener(obj => {
    console.debug('disconnected port', obj);

    if (deregisterInstrumentation) {
        deregisterInstrumentation()
    }
})

port.onMessage.addListener((m) => {
    console.debug("in content script, received message from background script", m);

    if (m.headers) {
        const headers = {}
        m.headers.forEach((str: string) => {
            const index = str.indexOf(':')

            if (index === -1) {
                return
            }
            const key = str.substring(0, index)
            const value = str.substring(index + 1)
            headers[key] = value
        })
        m.headers = headers
    }

    options = {
        ...options,
        ...m
    }
    instrument()
});
