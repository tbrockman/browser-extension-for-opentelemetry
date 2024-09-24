import type { LocalStorage, LocalStorageType } from "~storage/local"
import { consoleProxy } from "~utils/logging"
import { getPorts } from "~utils/background-ports"
import { MessageTypes, type ToRelayMessage } from "~types"

/**
 * Forwards storage changes to all content scripts.
 */
chrome.storage.onChanged.addListener((event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {

    // TODO: change this and related if we ever use storage in other areas
    if (area !== 'local') return

    consoleProxy.debug('storage changed', { event })

    const parsed = Object.entries(event).reduce((acc, [k, v]) => {
        return { ...acc, [k]: v.newValue }
    }, {} as Partial<LocalStorageType>)

    const message = {
        type: MessageTypes.StorageChanged,
        data: parsed
    } as ToRelayMessage
    consoleProxy.debug('storage changed message to send', message)

    const ports = getPorts()

    Object.keys(ports).forEach((k) => {
        ports[k].postMessage(message);
    })
})