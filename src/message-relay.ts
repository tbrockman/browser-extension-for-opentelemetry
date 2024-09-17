import { parseStorageResponse } from "~storage/local";
import type { PortMessage, TypedPort } from "~types";
import { consoleProxy } from "~utils/logging";
import type { LocalStorageType } from "~utils/options";

export type InjectRelayArgs = {
    sessionId: string
}

export default function injectRelay({ sessionId }: InjectRelayArgs) {
    consoleProxy.debug(`injecting relay for session ${sessionId}`)
    const port: TypedPort<PortMessage, Partial<LocalStorageType>> = chrome.runtime.connect();
    consoleProxy.debug(`port`, port)
    const fromBackground = `${sessionId}:relay-from-background`
    const toBackground = `${sessionId}:relay-to-background`

    // Relay messages/events from the content script to the background script
    window.addEventListener(toBackground, (event: CustomEvent) => {
        consoleProxy.debug(`received message to relay to background script`, event.detail);
        try {
            port.postMessage(event.detail)
        } catch (e) {
            consoleProxy.debug(`error sending message`, e)
        }
    })

    // Relay messages/events from the background script to the content script
    port.onDisconnect.addListener(obj => {
        consoleProxy.debug(`background script disconnected port`, obj);
        port.disconnect()
        const event = new CustomEvent(fromBackground, {
            detail: { type: 'disconnect' }
        })
        window.dispatchEvent(event)
    })

    port.onMessage.addListener((data) => {
        // TODO: don't just assume every message is a storage change
        // TODO: filter out forwarding unnecessary storage change events (which may leak sensitive data)
        consoleProxy.debug(`received message to relay from background script`, data);
        data = parseStorageResponse(data)
        consoleProxy.debug(`deserialized data from background script`, data);
        const event = new CustomEvent(fromBackground, {
            detail: { type: 'storageChanged', data }
        })
        window.dispatchEvent(event)
    })
}