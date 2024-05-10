import { Storage } from '@plasmohq/storage'
import { consoleProxy, stringHeadersToObject } from './util'
import injectContentScript from 'inlinefunc:./content-script'
import { MessageTypes, type OTLPExportTraceMessage, type OTLPExportLogMessage, type PortMessage, type TypedPort } from '~types'
import type { MatchPatternError, Options } from '~utils/options'
import { defaultOptions } from '~utils/options'
import { match } from '~utils'
import { matchPattern, presets } from 'browser-extension-url-match'

let storage = new Storage({ area: 'local' })
let ports = {}

const getDestinationForMessage = async (message: PortMessage) => {
    switch (message.type) {
        case MessageTypes.OTLPLogMessage:
            return await storage.get('logCollectorUrl') || defaultOptions.logCollectorUrl
        case MessageTypes.OTLPTraceMessage:
            return await storage.get('traceCollectorUrl') || defaultOptions.traceCollectorUrl
        case MessageTypes.OTLPMetricMessage:
            return await storage.get('metricCollectorUrl') || defaultOptions.metricsCollectorUrl
        default:
            throw new Error('unknown message type')
    }
}

const onConnect = async (p: TypedPort<Partial<Options>, PortMessage>) => {

    consoleProxy.debug('connection attempt on port', p)

    let patterns = await storage.get<string[]>('matchPatterns') || ['http://localhost/*']

    if (!match(p.sender.url, patterns)) {
        consoleProxy.debug('no pattern match, ignoring connection attempt', p.sender.url, patterns)
        return
    }

    ports[p.sender.tab.id] = p;

    p.onMessage.addListener(async (message) => {
        consoleProxy.debug('received message', message)

        switch (message.type) {
            case MessageTypes.OTLPLogMessage:
            case MessageTypes.OTLPTraceMessage:
                // Timeout currently ignored
                const { bytes } = MessageTypes.OTLPLogMessage ? message as OTLPExportLogMessage : message as OTLPExportTraceMessage

                // Even though the content script could send us the headers and url, we don't trust them
                // So in the worst case scenario we're sending arbitrary bytes to our chosen server
                const headers = {
                    ...stringHeadersToObject(await storage.get('headers')),
                    'Content-Type': 'application/x-protobuf',
                    Accept: 'application/x-protobuf'
                }
                let url = await getDestinationForMessage(message)
                const body = new Blob([new Uint8Array(bytes)], { type: 'application/x-protobuf' });

                try {
                    // TODO: retries and timeouts
                    await fetch(url, {
                        method: 'POST',
                        headers,
                        body,
                    })
                } catch (e) {
                    consoleProxy.error('error sending message', e)
                }
                break;
            default:
                consoleProxy.error('unhandled message type', message)
        }
    });

    p.onDisconnect.addListener((p) => {
        consoleProxy.debug('port disconnected', p)
        delete ports[p.sender.tab.id];
    })
}

chrome.storage.onChanged.addListener(({ matchPatterns, traceCollectorUrl, logCollectorUrl, events, headers, attributes, enabled, propagateTo, instrumentations, loggingEnabled, tracingEnabled }: Record<keyof Options, chrome.storage.StorageChange>, area) => {
    consoleProxy.debug('storage changed', { matchPatterns, traceCollectorUrl, logCollectorUrl, events, headers, attributes, enabled, propagateTo, instrumentations, area, loggingEnabled, tracingEnabled })

    Object.keys(ports).forEach((k) => {
        ports[k].postMessage({
            matchPatterns: matchPatterns?.newValue, // TODO: use match patterns to deregister instrumentation on existing content scripts, if necessary
            loggingEnabled: loggingEnabled?.newValue,
            tracingEnabled: tracingEnabled?.newValue,
            traceCollectorUrl: traceCollectorUrl?.newValue,
            logCollectorUrl: logCollectorUrl?.newValue,
            events: events?.newValue,
            headers: headers?.newValue,
            attributes: attributes?.newValue,
            enabled: enabled?.newValue,
            propagateTo: propagateTo?.newValue,
            instrumentations: instrumentations?.newValue,
        });
    })
})

chrome.runtime.onConnectExternal.addListener(onConnect);
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete") {

        // get user-specified match patterns or defaults
        const matchPatterns = await storage.get<string[]>('matchPatterns') || ['http://localhost/*']
        // check whether current URL matches any patterns
        const matches = match(tab.url, matchPatterns)

        if (!matches) {
            consoleProxy.debug("no pattern match, not injecting content script")
            return
        }

        consoleProxy.debug("injecting content script")

        // TODO: refactor, remove usage of @plasmohq/storage (so we don't have to make multiple get requests here) and have options store its own defaults
        const options: Options = {
            matchPatterns: await storage.get<string[]>('matchPatterns') || ['http://localhost/*'],
            matchPatternErrors: await storage.get('matchPatternErrors') || [],
            traceCollectorUrl: await storage.get('traceCollectorUrl') || 'http://localhost:4318/v1/traces',
            logCollectorUrl: await storage.get('logsCollectorUrl') || 'http://localhost:4318/v1/logs',
            metricsCollectorUrl: await storage.get('metricsCollectorUrl') || 'http://localhost:4318/v1/metrics',
            headers: await storage.get<Record<string, string>>('headers') || { 'x-custom-header': 'test' },
            attributes: await storage.get<Record<string, string>>('attributes') || { 'example': 'abc' },
            concurrencyLimit: 10,
            events: await storage.get<(keyof HTMLElementEventMap)[]>('events') || ['submit', 'click', 'keypress', 'scroll', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'],
            propagateTo: await storage.get<string[]>('propagateTo') || [],
            instrumentations: await storage.get<('fetch' | 'load' | 'interaction')[]>('instrumentations') || ['fetch', 'load', 'interaction'],
            enabled: await storage.get<boolean>('enabled') || true,
            tracingEnabled: await storage.get<boolean>('tracingEnabled') || true,
            loggingEnabled: await storage.get<boolean>('loggingEnabled') || true,
            metricsEnabled: await storage.get<boolean>('metricsEnabled') || true,
        }

        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: injectContentScript,
            args: [
                chrome.runtime.id,
                options,
            ],
            injectImmediately: true,
            world: "MAIN"
        })
    }
})