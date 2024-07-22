import { Storage } from '@plasmohq/storage'
import { consoleProxy } from '~utils/logging'
import injectContentScript from 'inlinefunc:./content-script'
import injectRelay from 'inlinefunc:./message-relay'
import { MessageTypes, type OTLPExportTraceMessage, type OTLPExportLogMessage, type PortMessage, type TypedPort } from '~types'
import type { LocalStorageType } from '~utils/options'
import { getOptions } from '~utils/options'
import { match } from '~utils/match-pattern'
import { serializer, deserializer } from '~utils/serde'
import { uuidv7 } from 'uuidv7';
import { getLocalStorage, type LocalStorage } from '~utils/storage'

let storage = new Storage({ area: 'local', serde: { serializer, deserializer } })
let ports = {}

const getDestinationForMessage = async (message: PortMessage) => {
    switch (message.type) {
        case MessageTypes.OTLPLogMessage:
            return (await getLocalStorage(['logCollectorUrl'])).logCollectorUrl
        case MessageTypes.OTLPTraceMessage:
            return (await getLocalStorage(['traceCollectorUrl'])).traceCollectorUrl
        case MessageTypes.OTLPMetricMessage:
            return (await getLocalStorage(['metricCollectorUrl'])).metricCollectorUrl
        default:
            throw new Error('unknown message type')
    }
}

const onConnect = async (p: TypedPort<Partial<LocalStorageType>, PortMessage>) => {

    consoleProxy.debug('connection attempt on port:', p)

    const { matchPatterns } = await getLocalStorage(['matchPatterns'])

    if (!match(p.sender.url, matchPatterns)) {
        consoleProxy.debug('no pattern match, ignoring connection attempt', p.sender.url, matchPatterns)
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
                // So in the absolute worst case adversarial scenario we're still just sending arbitrary bytes to our chosen server
                const stored = await storage.get<Map<string, string>>('headers')
                const headers = {
                    ...(Object.fromEntries(stored.entries())),
                    'Content-Type': 'application/x-protobuf',
                    Accept: 'application/x-protobuf'
                }
                let url = await getDestinationForMessage(message)
                const body = new Blob([new Uint8Array(bytes)], { type: 'application/x-protobuf' });

                try {
                    consoleProxy.log('sending message', { url, headers })
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

chrome.storage.onChanged.addListener((event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    consoleProxy.debug('storage changed', { event })

    const parsed = Object.entries(event).reduce((acc, [k, v]) => {
        return { ...acc, [k]: deserializer(v.newValue) }
    }, {})

    consoleProxy.debug('storage parsed', { parsed })

    Object.keys(ports).forEach((k) => {
        ports[k].postMessage(parsed);
    })
})

chrome.runtime.onConnect.addListener(onConnect);
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete") {

        // get user-specified match patterns or defaults
        const { matchPatterns } = await getLocalStorage(['matchPatterns'])
        // check whether current URL matches any patterns
        const matches = match(tab.url, matchPatterns)

        if (!matches) {
            consoleProxy.debug("no pattern match in onupdated listener, not injecting content script", tab.url, matchPatterns)
            return
        }

        consoleProxy.debug("injecting content script")

        // TODO: refactor, remove usage of @plasmohq/storage (so we don't have to make multiple get requests here) and have options store its own defaults
        const options = await getOptions()

        consoleProxy.debug("loaded options", options)
        const sessionId = uuidv7()

        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: injectRelay,
            args: [{
                sessionId
            }],
            injectImmediately: true,
            world: "ISOLATED"
        })

        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: injectContentScript,
            args: [{
                sessionId,
                options: serializer(options),
            }],
            injectImmediately: true,
            world: "MAIN"
        })
    }
})