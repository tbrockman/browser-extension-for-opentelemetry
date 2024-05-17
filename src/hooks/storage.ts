import { Storage } from "@plasmohq/storage"
import { useStorage as usePlasmoStorage } from "@plasmohq/storage/hook"

import type { Options } from "~utils/options"
import { defaultOptions } from "~utils/options"
import { serializer, deserializer } from "~utils/serde"

// technically we could store more than just options, but we don't currently
// update default handling if we ever do
type StorageKey = keyof Options
type StorageType = Options[StorageKey]

const localStorage = new Storage({ area: "local", serde: { serializer, deserializer } })
const syncStorage = new Storage({ area: "sync", serde: { serializer, deserializer } })

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