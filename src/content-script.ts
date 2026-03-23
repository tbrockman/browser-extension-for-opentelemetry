import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import {
    LoggerProvider,
    SimpleLogRecordProcessor
} from '@opentelemetry/sdk-logs';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_TELEMETRY_SDK_LANGUAGE, ATTR_TELEMETRY_SDK_NAME, ATTR_TELEMETRY_SDK_VERSION } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { MessageTypes, type CustomAppEvent } from '~types';
import { consoleProxy } from '~utils/logging';
import { wrapConsoleWithLoggerProvider } from '~telemetry/logs';
import { de } from '~utils/serde';
import type { ContentScriptConfigurationType } from '~storage/local/configuration';
import { config } from '~config';
import { TraceExporter } from '~exporters/trace';
import { LogExporter } from '~exporters/log';

// TODO: investigate why reinstrumenting isn't working (or whether it can)
const instrument = (sessionId: string, options: ContentScriptConfigurationType) => {

    if (!options || !options.enabled || !options.instrumentations || options.instrumentations.length === 0 || window.__OTEL_BROWSER_EXT_INSTRUMENTATION__) {
        consoleProxy.debug(`not instrumenting as either options missing or already instrumented`, options, window.__OTEL_BROWSER_EXT_INSTRUMENTATION__)
        return () => { }
    }
    window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ = () => { }
    consoleProxy.debug(`instrumenting`, { sessionId, options })

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: config.name,
        [ATTR_SERVICE_VERSION]: config.version,
        [ATTR_TELEMETRY_SDK_LANGUAGE]: 'webjs',
        [ATTR_TELEMETRY_SDK_NAME]: 'opentelemetry',
        [ATTR_TELEMETRY_SDK_VERSION]: config.otelSdkVersion,
        'browser.name': process.env.PLASMO_BROWSER, // TODO: fix why this is undefined
        'extension.session.id': sessionId,
        ...Object.fromEntries(options.attributes.entries())
    })

    let tracerProvider: WebTracerProvider | undefined

    if (options.tracingEnabled) {
        const traceExporter = new TraceExporter(sessionId);
        // TODO: make batching configurable, choosing simple for now to avoid losing data on page navigations
        const traceProcessor = new SimpleSpanProcessor(traceExporter);
        tracerProvider = new WebTracerProvider({
            resource,
            spanProcessors: [traceProcessor]
        })
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

    let loggerProvider: LoggerProvider | undefined

    if (options.loggingEnabled) {
        const logExporter = new LogExporter(sessionId);
        loggerProvider = new LoggerProvider({
            resource,
            // TODO: make batching configurable, choosing simple for now to avoid losing data on page navigations
            processors: [new SimpleLogRecordProcessor(logExporter)]
        })
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
        deregister()
        window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ = undefined
    }
}

export type InjectContentScriptArgs = {
    sessionId: string,
    options: ContentScriptConfigurationType | string,
    retries?: number,
    backoff?: number,
}

export default function injectContentScript({ sessionId, options, retries = 10, backoff = 10 }: InjectContentScriptArgs) {
    if (retries <= 0) {
        return
    }

    try {
        if (typeof options === 'string') {
            options = de<ContentScriptConfigurationType>(options)
        }
        window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ = instrument(sessionId, options);

        const key = `${sessionId}:relay-from-background`
        const listener = (event: CustomAppEvent) => {
            try {
                if (event.detail.type === MessageTypes.Disconnect) {
                    consoleProxy.debug(`received disconnect message from relay`, event.detail)
                    window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ && window.__OTEL_BROWSER_EXT_INSTRUMENTATION__()
                    window.removeEventListener(key, listener)
                } else if (event.detail.type === MessageTypes.ConfigurationChanged) {
                    consoleProxy.debug(`received storage changed message from relay`, event.detail)
                    options = {
                        ...options as ContentScriptConfigurationType,
                        ...(event.detail.data || {})
                    }
                    consoleProxy.debug(`re-instrumenting with parsed options`, options)
                    window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ && window.__OTEL_BROWSER_EXT_INSTRUMENTATION__()
                    window.__OTEL_BROWSER_EXT_INSTRUMENTATION__ = instrument(sessionId, options)
                } else {
                    consoleProxy.debug(`received malformed message from relay`, event.detail)
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
