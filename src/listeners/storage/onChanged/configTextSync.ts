import { de, ser } from "~utils/serde";
import { getStorage, setLocalStorage } from "~storage/local";
import { LocalStorage } from "~storage/local";
import { Configuration, UserFacingConfiguration } from "~storage/local/configuration";

chrome.storage.onChanged.addListener(async (event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    const { configText } = event

    // Serialize config text as storage, persist changes 
    if (event.configText) {
        console.log('storage changed in listener', event, configText.newValue)

        try {
            const config = de<UserFacingConfiguration>(de(configText.newValue), UserFacingConfiguration)
            console.log('deserialized config', config)
            await setLocalStorage(config.serialize())
        } catch (e) {
            console.error('failed to deserialize config', e)
        }
    }
    // Otherwise, serialize config as config text, persist changes
    else {
        const stored = await getStorage('local', new Configuration())
        console.log('combined config', stored)
        await setLocalStorage({ configText: ser(UserFacingConfiguration.from(stored), true) })
    }
})