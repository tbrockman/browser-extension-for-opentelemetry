import { de, ser } from "~utils/serde";
import { getLocalStorage, getStorage, removeLocalStorage, setLocalStorage } from "~storage/local";
import { LocalStorage } from "~storage/local";
import { Configuration, defaultConfiguration, UserFacingConfiguration } from "~storage/local/configuration";
import { consoleProxy } from "~utils/logging";
import { pick } from "~utils/generics";

/**
 * Syncs changes between configText and config storage.
 */
chrome.storage.onChanged.addListener(async (event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    const { configText, editorState, ...other } = pick(event, ['configText', 'editorState', ...(Object.keys(defaultConfiguration) as (keyof Configuration)[])])

    // Serialize config text as storage, persist changes 
    if (event.configText) {
        try {
            const { editorState } = await getLocalStorage(['editorState'])
            const configTextString: string = de(configText.newValue)

            consoleProxy.debug('editorstate?.doc', editorState?.doc?.toString(), 'configText', configTextString)

            if (configTextString === editorState?.doc?.toString()) {
                consoleProxy.debug('config text same as editor doc state, skipping')
                return
            }
            const config = de<UserFacingConfiguration>(configTextString, UserFacingConfiguration)
            consoleProxy.debug('deserialized config', config)
            await setLocalStorage(config.serializable())
        } catch (e) {
            consoleProxy.error('failed to deserialize config', e)
        }
    }
    // Technically we could translate these changes into EditorState transactions
    // which would allow cool things like undo/redo, but that seems like extra work for now
    else if (Object.keys(other).length > 0) {
        // Otherwise, serialize config as config text, persist changes, *and* clear editor state
        // Should only be ran when user configuration inputs change
        // assumes that an immediate read will contain the latest config (TODO: verify this assumption)
        const stored = await getStorage('local', new Configuration())
        const from = UserFacingConfiguration.from(stored)
        consoleProxy.debug('user facing config to be serialized', from)
        const serialized = ser(from, true)
        consoleProxy.debug('serialized configText', serialized)
        await removeLocalStorage(['editorState'])
        await setLocalStorage({ configText: serialized })
    }
})