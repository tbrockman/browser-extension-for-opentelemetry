import { de, ser } from "~utils/serde";
import { getStorage, setLocalStorage } from "~storage/local";
import { LocalStorage } from "~storage/local";
import { Configuration, UserFacingConfiguration } from "~storage/local/configuration";
import { consoleProxy } from "~utils/logging";

/**
 * Syncs changes between configText and config storage.
 */
chrome.storage.onChanged.addListener(async (event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    const { configText } = event

    // Serialize config text as storage, persist changes 
    if (event.configText) {
        try {
            const config = de<UserFacingConfiguration>(de(configText.newValue), UserFacingConfiguration)
            consoleProxy.debug('deserialized config', config)
            await setLocalStorage(config.serializable())
        } catch (e) {
            consoleProxy.error('failed to deserialize config', e)
        }
    }
    // Otherwise, serialize config as config text, persist changes
    else {
        const stored = await getStorage('local', new Configuration())
        const from = UserFacingConfiguration.from(stored)
        consoleProxy.debug('user facing config to be serialized', from)
        const serialized = ser(from, true)
        consoleProxy.debug('serialized configText', serialized)
        await setLocalStorage({ configText: serialized })
    }
})