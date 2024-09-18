import { consoleProxy } from '~utils/logging'
import { MessageTypes, type OTLPExportTraceMessage, type OTLPExportLogMessage, type PortMessage, type TypedPort } from '~types'
import { match } from '~utils/match-pattern'
import { getLocalStorage, type LocalStorageType } from '~storage/local'
import { addPort, removePort } from '~utils/ports'

const getDestinationForMessage = async (message: PortMessage) => {
    switch (message.type) {
        case MessageTypes.OTLPLogMessage:
            return (await getLocalStorage(['logCollectorUrl'])).logCollectorUrl
        case MessageTypes.OTLPTraceMessage:
            return (await getLocalStorage(['traceCollectorUrl'])).traceCollectorUrl
        case MessageTypes.OTLPMetricMessage:
        // return (await getLocalStorage(['metricCollectorUrl'])).metricCollectorUrl
        default:
            throw new Error('unknown message type')
    }
}

chrome.runtime.onConnect.addListener(async (p: TypedPort<Partial<LocalStorageType>, PortMessage>) => {

    consoleProxy.debug('connection attempt on port:', p)

    const { matchPatterns } = await getLocalStorage(['matchPatterns'])

    if (!match(p.sender.url, matchPatterns)) {
        consoleProxy.debug('no pattern match, ignoring connection attempt', p.sender.url, matchPatterns)
        return
    }

    addPort(p)

    consoleProxy.debug('pattern match', p.sender.url, matchPatterns)
    p.onMessage.addListener(async (message) => {
        consoleProxy.debug('received message', message)

        switch (message.type) {
            case MessageTypes.OTLPLogMessage:
            case MessageTypes.OTLPTraceMessage:
                // Timeout currently ignored
                const { bytes } = MessageTypes.OTLPLogMessage ? message as OTLPExportLogMessage : message as OTLPExportTraceMessage

                // Even though the content script could send us the headers and url, we don't trust them
                // So in the absolute worst case adversarial scenario we're still just sending arbitrary bytes to our chosen server
                const { headers: stored } = await getLocalStorage(['headers'])
                // TODO: stop sending attributes to content script, set here instead
                consoleProxy.debug('stored headers', stored)
                const headers = {
                    ...(Object.fromEntries(stored.entries())),
                    'Content-Type': 'application/x-protobuf',
                    Accept: 'application/x-protobuf'
                }
                let url = await getDestinationForMessage(message)
                consoleProxy.debug('message destination', url)
                const body = new Blob([new Uint8Array(bytes)], { type: 'application/x-protobuf' });

                try {
                    consoleProxy.debug('sending message', { url, headers })
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
        removePort(p)
    })
});