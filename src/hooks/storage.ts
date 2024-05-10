import { Storage } from "@plasmohq/storage"
import { useStorage as usePlasmoStorage } from "@plasmohq/storage/hook"

import type { Options } from "~utils/options"
import { defaultOptions } from "~utils/options"

type StorageKey = keyof Options
type StorageType = Options[StorageKey]

const localStorage = new Storage({ area: "local" })
const syncStorage = new Storage({ area: "sync" })

function useStorageSingleton(area: "local" | "sync" = "local") {
    if (area === "local") {
        return localStorage
    }
    return syncStorage
}

function useStorage<T = StorageType>(key: StorageKey, instance: Storage) {
    return usePlasmoStorage<T>({
        key,
        instance
    }, (v?: T, isHydrated?: boolean) => v === undefined ? defaultOptions[key] as T : v)
}

function useLocalStorage<T = StorageType>(key: StorageKey) {
    return useStorage<T>(key, localStorage)
}

function useSyncStorage<T>(key: StorageKey) {
    return useStorage<T>(key, syncStorage)
}

export {
    useStorage,
    useStorageSingleton,
    useLocalStorage,
    useSyncStorage
}