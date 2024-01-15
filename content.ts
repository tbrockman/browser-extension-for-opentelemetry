import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    world: "MAIN",
    run_at: "document_start"
}

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { B3Propagator } from '@opentelemetry/propagator-b3';

const initialState = {
    url: 'http://localhost:4318/v1/traces',
    headers: {},
}

const collectorOptions = {
    url: initialState.url, // url is optional and can be omitted - default is http://localhost:4318/v1/traces
    headers: initialState.headers, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
};
console.log(collectorOptions)

const exporter = new ConsoleSpanExporter();
// const exporter = new OTLPTraceExporter(collectorOptions);
const provider = new WebTracerProvider();
const processor = new SimpleSpanProcessor(exporter);
provider.addSpanProcessor(processor);
provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator(),
});

registerInstrumentations({
    instrumentations: [
        getWebAutoInstrumentations({
            // load custom configuration for xml-http-request instrumentation
            '@opentelemetry/instrumentation-xml-http-request': {
                clearTimingResources: true,
            },
            '@opentelemetry/instrumentation-document-load': {},
            '@opentelemetry/instrumentation-fetch': {},
            '@opentelemetry/instrumentation-user-interaction': {
                eventNames: ['submit', 'click', 'keypress'],
            },
        }),
    ],
});

let myPort = chrome.runtime.connect('bldddniapapecnijdhfifheelpnlhodi');

console.log('port connected', myPort)

myPort.onDisconnect.addListener(obj => {
    console.log('disconnected port', obj);
})

myPort.onMessage.addListener((m) => {
    console.log("In content script, received message from background script: ");
    console.log(m);
});
