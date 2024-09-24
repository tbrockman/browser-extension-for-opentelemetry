import { getLocalStorage, defaultLocalStorage } from "~storage/local"

const getOptions = async () => {
    return await getLocalStorage()
}

export {
    defaultLocalStorage as defaultOptions,
    getOptions,
}
