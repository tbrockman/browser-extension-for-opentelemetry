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
import { B3Propagator } from '@opentelemetry/propagator-b3';

let options = {
    url: 'http://localhost:4318/v1/traces', // url is optional and can be omitted - default is http://localhost:4318/v1/traces
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
    events: ['submit', 'click', 'keypress', 'scroll'] as (keyof HTMLElementEventMap)[], // an optional array of event names to be instrumented
    telemetry: ['logs', 'traces']
};
let deregisterInstrumentation

const instrument = () => {

    console.debug('instrumenting with options', options)

    if (deregisterInstrumentation) {
        console.debug('deregistering existing instrumentation')
        deregisterInstrumentation()
    }

    const exporter = new ConsoleSpanExporter();
    const trace = new OTLPTraceExporter({
        url: options.url,
        headers: {},
        concurrencyLimit: options.concurrencyLimit,
    });
    // #TODO: instrument console logs
    // const log = new OTLPLogExporter({
    //     url: options.url,
    //     headers: options.headers,
    //     concurrencyLimit: options.concurrencyLimit,
    // });
    const provider = new WebTracerProvider();
    const traceProcessor = new BatchSpanProcessor(trace);
    const processor = new SimpleSpanProcessor(exporter);
    provider.addSpanProcessor(processor);
    provider.addSpanProcessor(traceProcessor);
    provider.register({
        contextManager: new ZoneContextManager(),
        propagator: new B3Propagator(),
    });
    
    deregisterInstrumentation = registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations({
                // load custom configuration for xml-http-request instrumentation
                '@opentelemetry/instrumentation-xml-http-request': {
                    clearTimingResources: true,
                },
                '@opentelemetry/instrumentation-document-load': {},
                '@opentelemetry/instrumentation-fetch': {},
                '@opentelemetry/instrumentation-user-interaction': {
                    eventNames: options.events,
                },
            }),
        ],
        tracerProvider: provider,
    });
}

let myPort = chrome.runtime.connect('ekcjelbccmfijnglpcgfgkegjhgngeen');

myPort.onDisconnect.addListener(obj => {
    console.debug('disconnected port', obj);

    if (deregisterInstrumentation) {
        deregisterInstrumentation()
    }
})

myPort.onMessage.addListener((m) => {
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
