import { Storage } from '@plasmohq/storage'
import { consoleProxy, stringHeadersToObject } from './util'
import injectContentScript from 'inlinefunc:./content-script'
import type { Options } from '~content-script'
import { MessageTypes, type OTLPSendMessage, type TypedPort } from '~types'

let storage = new Storage({ area: 'local' })
let ports = {}

const connected = async (p: TypedPort) => {
    ports[p.sender.tab.id] = p;

    p.onMessage.addListener(async (message) => {
        consoleProxy.debug('received message', message)

        switch (message.type) {
            case MessageTypes.OTLPSendMessage:
                // Timeout currently ignored
                const { bytes, timeout } = message as OTLPSendMessage

                // Even though the content script could send us the headers and url, we don't trust them
                // So in the worst case scenario we're only sending arbitrary bytes to our chosen server
                const headers = {
                    ...stringHeadersToObject(await storage.get('headers')),
                    'Content-Type': 'application/x-protobuf',
                    Accept: 'application/x-protobuf'
                }
                const url = await storage.get('url') || 'http://localhost:4318/v1/traces'
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
                consoleProxy.error('unhandled message type', message.type)
        }
    });

    p.onDisconnect.addListener((p) => {
        consoleProxy.debug('port disconnected', p)
        delete ports[p.sender.tab.id];
    })
}

chrome.storage.onChanged.addListener(({ url, events, telemetry, headers, enabled, propagateTo, instrumentations }, area) => {
    consoleProxy.debug('storage changed', url, events, telemetry, headers, enabled, propagateTo, instrumentations, area)
    Object.keys(ports).forEach((k) => {
        ports[k].postMessage({
            url: url?.newValue,
            events: events?.newValue,
            telemetry: telemetry?.newValue,
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
            url: await storage.get('url') || 'http://localhost:4318/v1/traces',
            headers: stringHeadersToObject(await storage.get('headers')),
            concurrencyLimit: 10,
            events: await storage.get<(keyof HTMLElementEventMap)[]>('events') || ['submit', 'click', 'keypress', 'scroll'],
            telemetry: await storage.get<('logs' | 'traces')[]>('telemetry') || ['traces'],
            propagateTo: await storage.get<string[]>('propagateTo') || [],
            instrumentations: await storage.get<('fetch' | 'load' | 'interaction')[]>('instrumentations') || ['fetch', 'load', 'interaction'],
            enabled: await storage.get<boolean>('enabled') || true,
        }

        chrome.scripting.executeScript({
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