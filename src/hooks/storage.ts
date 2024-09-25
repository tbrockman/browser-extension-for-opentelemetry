import { useEffect, useState } from "react"
import { de } from "~utils/serde";
import { defaultLocalStorage, getStorage, LocalStorage, type ExtractLocalStorageKeys as ExtractKeysFromLocalStorage, type LocalStorageType } from "~storage/local";
import { consoleProxy } from "~utils/logging";
import { pick } from "~utils/generics";

export type ProxyListeners = {
    [K in chrome.storage.AreaName]: ((data: StorageCache[K]) => void)[];
};

export type StorageCache = {
    local: LocalStorageType
    sync?: any,
    session?: any,
    managed?: any,
}

const cache: StorageCache = {
    local: {} as LocalStorageType,
}

const proxyListeners: ProxyListeners = {
    local: [],
    sync: [],
    session: [],
    managed: [],
}

const storageListener = (event: Record<string, chrome.storage.StorageChange>, area: chrome.storage.AreaName) => {

    Object.entries(event).forEach(([key, { newValue }]) => {
        cache[area][key] = de(newValue);
    })

    consoleProxy.debug('storage changed in storageListener, cache after:', cache[area])

    proxyListeners[area].forEach((listener) => {
        listener(cache[area]);
    })
}

chrome.storage.onChanged.addListener(storageListener);

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

export function useStorage<T extends object>(keysWithDefaults: T, storageArea: chrome.storage.AreaName = 'local'): Partial<T> {
    const [state, setState] = useState(pick(cache[storageArea], Object.keys(keysWithDefaults)) as Partial<T>);

    const listener = (newState: T) => {
        const intersection = pick(newState, Object.keys(keysWithDefaults) as (keyof T)[]);
        setState({ ...intersection });
    }

    useEffect(() => {
        if (!keysWithDefaults || Object.keys(keysWithDefaults).length == 0) return;
        consoleProxy.debug('looking for', keysWithDefaults, `in cache['${storageArea}']:`);
        // if we can answer the request from cache, do so
        if (Object.keys(keysWithDefaults).every((key) => key in cache[storageArea])) {
            consoleProxy.debug('cache hit for', keysWithDefaults, `in cache['${storageArea}']:`);
            return;
        }

        getStorage(storageArea, keysWithDefaults).then((response) => {
            cache[storageArea] = { ...cache[storageArea], ...response };
            setState(response);
        });
    }, [])

    useEffect(() => {
        proxyListeners[storageArea].push(listener);

        return () => {
            const index = proxyListeners[storageArea].indexOf(listener);
            if (index !== -1) {
                proxyListeners[storageArea].splice(index, 1);
            }
        }
    }, [keysWithDefaults])
    return state;
}
