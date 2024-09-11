import { getLocalStorage, defaultLocalStorage } from "~storage/local"
import type { ConfigurationType } from "~storage/local/configuration"

const getOptions = async () => {
    return await getLocalStorage()
}

export {
    defaultLocalStorage as defaultOptions,
    getOptions,
}

export type {
    ConfigurationType as LocalStorageType
}