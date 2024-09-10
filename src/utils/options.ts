import { getLocalStorage, defaultLocalStorage, type Configuration } from "./storage"

const getOptions = async () => {
    return await getLocalStorage()
}

export {
    defaultLocalStorage as defaultOptions,
    getOptions,
}

export type {
    Configuration as LocalStorageType
}