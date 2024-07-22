import { useEffect, useState } from "react"
import type { Values } from "~types"
import { deserializer } from "~utils/serde";
import { defaultLocalStorage, getStorage, LocalStorage } from "~utils/storage"

export function useLocalStorage<T extends (keyof LocalStorage)[]>(keys: T): {
    [K in T[number]]: LocalStorage[K];
} {
    const obj = keys.reduce((acc, key) => {
        return { ...acc, [key]: defaultLocalStorage[key] }
    }, {} as {
        [K in T[number]]: LocalStorage[K];
    });

    return useStorage(obj, 'local');
}

export function useStorage<T extends Record<string, Values>>(keysWithDefaults: T, storageArea: chrome.storage.AreaName = 'sync'): T {
    const [state, setState] = useState(keysWithDefaults);

    const listener = (event: Record<string, chrome.storage.StorageChange>, area: chrome.storage.AreaName) => {

        if (area !== storageArea) return;

        const intersection = Object.entries(event).filter(([key,]) => keysWithDefaults.hasOwnProperty(key));

        if (intersection.length == 0) return;

        const newStorage: T = intersection.reduce((acc, [key, { newValue }]) => {
            if (!keysWithDefaults.hasOwnProperty(key)) return acc;

            return { ...acc, [key]: deserializer(newValue) }
        }, state);

        setState(newStorage);
    }

    useEffect(() => {
        if (!keysWithDefaults || Object.keys(keysWithDefaults).length == 0) return;

        getStorage(storageArea, keysWithDefaults).then((response) => {
            setState(response);
        });
    }, [])

    useEffect(() => {
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, [keysWithDefaults])
    return state;
}
