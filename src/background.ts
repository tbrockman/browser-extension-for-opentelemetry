import { Storage } from '@plasmohq/storage'
import { consoleProxy, stringHeadersToObject } from './util'
import injectContentScript from 'inlinefunc:./content-script'
import { MessageTypes, type OTLPExportTraceMessage, type OTLPExportLogMessage, type Options, type PortMessage, type TypedPort } from '~types'

let storage = new Storage({ area: 'local' })
let ports = {}

const connected = async (p: TypedPort<Partial<Options>, PortMessage>) => {
    ports[p.sender.tab.id] = p;

    p.onMessage.addListener(async (message) => {
        consoleProxy.debug('received message', message)

        switch (message.type) {
            case MessageTypes.OTLPLogMessage:
            case MessageTypes.OTLPTraceMessage:
                // Timeout currently ignored
                const { bytes, timeout } = MessageTypes.OTLPLogMessage ? message as OTLPExportLogMessage : message as OTLPExportTraceMessage

                // Even though the content script could send us the headers and url, we don't trust them
                // So in the worst case scenario we're sending arbitrary bytes to our chosen server
                const headers = {
                    ...stringHeadersToObject(await storage.get('headers')),
                    'Content-Type': 'application/x-protobuf',
                    Accept: 'application/x-protobuf'
                }
                let url: string

                if (message.type === MessageTypes.OTLPLogMessage) {
                    url = await storage.get('logCollectorUrl') || 'http://localhost:4318/v1/logs'
                } else {
                    url = await storage.get('traceCollectorUrl') || 'http://localhost:4318/v1/traces'
                }
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

chrome.storage.onChanged.addListener(({ traceCollectorUrl, logCollectorUrl, events, headers, enabled, propagateTo, instrumentations, loggingEnabled, tracingEnabled }: Record<keyof Options, chrome.storage.StorageChange>, area) => {
    consoleProxy.debug('storage changed', { traceCollectorUrl, logCollectorUrl, events, headers, enabled, propagateTo, instrumentations, area, loggingEnabled, tracingEnabled })
    Object.keys(ports).forEach((k) => {
        ports[k].postMessage({
            loggingEnabled: loggingEnabled?.newValue,
            tracingEnabled: tracingEnabled?.newValue,
            traceCollectorUrl: traceCollectorUrl?.newValue,
            logCollectorUrl: logCollectorUrl?.newValue,
            events: events?.newValue,
            headers: headers?.newValue,
            enabled: enabled?.newValue,
            propagateTo: propagateTo?.newValue,
            instrumentations: instrumentations?.newValue,
        });
    })
})

chrome.runtime.onConnectExternal.addListener(connected);
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete") {

        consoleProxy.debug("injecting content script")

        const options: Options = {
            traceCollectorUrl: await storage.get('traceCollectorUrl') || 'http://localhost:4318/v1/traces',
            logCollectorUrl: await storage.get('logsCollectorUrl') || 'http://localhost:4318/v1/logs',
            headers: stringHeadersToObject(await storage.get('headers')),
            concurrencyLimit: 10,
            events: await storage.get<(keyof HTMLElementEventMap)[]>('events') || ['submit', 'click', 'keypress', 'scroll', 'resize', 'drag', 'cut', 'copy', 'input', 'mousedown', 'mouseup', 'mouseover'],
            propagateTo: await storage.get<string[]>('propagateTo') || [],
            instrumentations: await storage.get<('fetch' | 'load' | 'interaction')[]>('instrumentations') || ['fetch', 'load', 'interaction'],
            enabled: await storage.get<boolean>('enabled') || true,
            tracingEnabled: await storage.get<boolean>('tracingEnabled') || true,
            loggingEnabled: await storage.get<boolean>('loggingEnabled') || true,
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