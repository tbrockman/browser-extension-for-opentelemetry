import { getLocalStorage, defaultLocalStorage, type LocalStorageType } from "./storage"

const getOptions = async () => {
    return await getLocalStorage()
}

export {
    defaultLocalStorage as defaultOptions,
    getOptions,
}

export type {
    LocalStorageType
}