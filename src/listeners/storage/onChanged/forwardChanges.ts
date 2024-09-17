import type { LocalStorage } from "~storage/local"
import { consoleProxy } from "~utils/logging"
import { getPorts } from "~utils/ports"
import { de } from "~utils/serde"

/**
 * Forwards storage changes to all content scripts.
 */
chrome.storage.onChanged.addListener((event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    consoleProxy.debug('storage changed', { event })

    const parsed = Object.entries(event).reduce((acc, [k, v]) => {
        return { ...acc, [k]: v.newValue }
    }, {})

    consoleProxy.debug('storage parsed', { parsed })

    const ports = getPorts()

    Object.keys(ports).forEach((k) => {
        ports[k].postMessage(parsed);
    })
})