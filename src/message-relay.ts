import { parseStorageResponse, type LocalStorageType } from "~storage/local";
import { defaultContentScriptConfiguration } from "~storage/local/configuration/content-script";
import type { PortMessage, TypedPort } from "~types";
import { pick } from "~utils/generics";
import { consoleProxy } from "~utils/logging";

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
        consoleProxy.debug(`received message to relay from background script`, data);
        // extract only keys necessary for content script
        data = pick(parseStorageResponse(data), Object.keys(defaultContentScriptConfiguration))

        if (!data) {
            return
        }
        consoleProxy.debug(`deserialized data from background script`, data);
        const event = new CustomEvent(fromBackground, {
            detail: { type: 'storageChanged', data }
        })
        window.dispatchEvent(event)
    })
}