import { parseStorageResponse } from "~storage/local";
import { defaultContentScriptConfiguration } from "~storage/local/configuration/content-script";
import { MessageTypes, type CustomAppEvent, type ToContentScriptMessage, type ToBackgroundMessage, type TypedPort, type ToRelayMessage, type ConfigurationChangedMessage } from "~types";
import { pick } from "~utils/generics";
import { consoleProxy } from "~utils/logging";

export type InjectRelayArgs = {
    sessionId: string
}

export default function injectRelay({ sessionId }: InjectRelayArgs) {
    consoleProxy.debug(`injecting relay for session ${sessionId}`)
    const port: TypedPort<ToBackgroundMessage, ToRelayMessage> = chrome.runtime.connect();
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
        const event: CustomAppEvent = new CustomEvent(fromBackground, {
            detail: { type: MessageTypes.Disconnect } as ToContentScriptMessage
        })
        window.dispatchEvent(event)
    })

    port.onMessage.addListener((message) => {
        consoleProxy.debug(`received message to relay from background script`, message);

        switch (message.type) {
            case MessageTypes.StorageChanged:
                const relay = {
                    type: MessageTypes.ConfigurationChanged,
                    // extract only the keys content script needs to run (limiting data exposure)
                    data: pick(parseStorageResponse(message.data), Object.keys(defaultContentScriptConfiguration))
                } as ConfigurationChangedMessage
                consoleProxy.debug(`deserialized message to be relayed`, relay);
                // no keys we care about
                if (Object.keys(relay.data).length === 0) {
                    consoleProxy.debug(`no relevant changes found to forward to content script, skipping`);
                    return
                }
                const event: CustomAppEvent = new CustomEvent(fromBackground, {
                    detail: relay
                })
                window.dispatchEvent(event)
                break
            default:
                consoleProxy.debug(`malformed message`, message)
        }
    })
}