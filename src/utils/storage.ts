import type { Storage } from "@plasmohq/storage"

export const getWithDefaults = async<T>(storage: Storage, defaults: T): Promise<T> => {
    const result = await Promise.all(Object.keys(defaults).map(async (key) => {
        return [key, await storage.get(key) || defaults[key]]
    }))
    return Object.fromEntries(result) as T
}
