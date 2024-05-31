import type { PortMessage, TypedPort } from "~types";
import { consoleProxy } from "~utils/logging";
import type { Options } from "~utils/options";

export type InjectRelayArgs = {
    sessionId: string
}

export default function injectRelay({ sessionId }: InjectRelayArgs) {
    consoleProxy.debug(`injecting relay for session ${sessionId}`)
    const port: TypedPort<PortMessage, Partial<Options>> = chrome.runtime.connect();
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
        consoleProxy.debug(`received message from background script`, data);
        const event = new CustomEvent(fromBackground, {
            detail: { type: 'storageChanged', data }
        })
        window.dispatchEvent(event)
    })
}