import { getLocalStorage, defaultLocalStorage, type LocalStoragePublic } from "./storage"

const getOptions = async () => {
    return await getLocalStorage()
}

export {
    defaultLocalStorage as defaultOptions,
    getOptions,
}

export type {
    LocalStoragePublic as LocalStorageType
}