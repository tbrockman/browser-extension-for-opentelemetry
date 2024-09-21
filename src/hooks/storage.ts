import { useEffect, useState } from "react"
import { de } from "~utils/serde";
import { defaultLocalStorage, getStorage, LocalStorage, type ExtractLocalStorageKeys as ExtractKeysFromLocalStorage } from "~storage/local";

export function useLocalStorage<T extends (keyof LocalStorage)[]>(keys?: T): Partial<ExtractKeysFromLocalStorage<T>> {
    if (!keys) {
        return useStorage(defaultLocalStorage, 'local') as Partial<ExtractKeysFromLocalStorage<T>>
    }
    const obj = keys.reduce((acc, key) => {
        if (key in defaultLocalStorage) {
            acc[key] = defaultLocalStorage[key];
        }
        return acc;
    }, {} as Partial<Pick<LocalStorage, T[number]>>);
    return useStorage(obj, 'local') as Partial<ExtractKeysFromLocalStorage<T>>;
}

export function useStorage<T extends object>(keysWithDefaults: T, storageArea: chrome.storage.AreaName = 'sync'): Partial<T> {
    const [state, setState] = useState({} as Partial<T>);

    const listener = (event: Record<string, chrome.storage.StorageChange>, area: chrome.storage.AreaName) => {

        if (area !== storageArea) return;

        const intersection = Object.entries(event).filter(([key,]) => keysWithDefaults.hasOwnProperty(key));

        if (intersection.length == 0) return;

        const newStorage: Partial<T> = intersection.reduce((acc, [key, { newValue }]) => {
            if (!keysWithDefaults.hasOwnProperty(key)) return acc;
            return { ...acc, [key]: de(newValue) }
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
