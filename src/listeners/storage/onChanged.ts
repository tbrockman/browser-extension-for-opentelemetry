import { de, ser } from "~utils/serde";
import { Configuration, getLocalStorage, setLocalStorage } from "~utils/storage";
import { LocalStorage } from "~utils/storage";

chrome.storage.onChanged.addListener(async (event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    const { configText, ...other } = event

    // Serialize config text as storage, persist changes 
    if (event.configText) {
        console.log('storage changed in listener', event, configText.newValue)

        try {
            const config = de<Configuration>(de(configText.newValue), Configuration)
            console.log('deserialized config', config)
            await setLocalStorage(config)
        } catch (e) {
            console.error('failed to deserialize config', e)
        }
    }
    // Otherwise, serialize config as config text, persist changes
    else {
        console.log('config changed in listener', other)
        const reduced = Object.entries(other).reduce((acc, [k, v]) => {
            const deserialized = de(v.newValue)

            if (deserialized instanceof Map) {
                return { ...acc, [k]: Object.fromEntries(deserialized.entries()) }
            }
            return { ...acc, [k]: deserialized }
        }, {})
        const { configText, ...full } = await getLocalStorage()
        console.log('reduced changes', reduced)
        const config = {
            ...full,
            ...reduced
        }
        console.log('constructed config', config)
        await setLocalStorage({ configText: ser(config, true) })
    }
})