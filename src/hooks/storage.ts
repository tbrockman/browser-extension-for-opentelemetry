import { useCallback, useEffect, useState } from "react"
import { de } from "~utils/serde";
import { defaultLocalStorage, getStorage, LocalStorage, setLocalStorage, type ExtractLocalStorageKeys as ExtractKeysFromLocalStorage, type LocalStorageType } from "~storage/local";
import { consoleProxy } from "~utils/logging";
import { pick } from "~utils/generics";
import { shallowEqual } from "@mantine/hooks";

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

    const updates = {}

    Object.entries(event).forEach(([key, { newValue }]) => {
        cache[area][key] = de(newValue);
        updates[key] = cache[area][key];
    })

    consoleProxy.debug('storage changed in storageListener, cache after:', cache[area])

    proxyListeners[area].forEach((listener) => {
        listener(updates as any);
    })
}

chrome.storage.onChanged.addListener(storageListener);

export type UseLocalStorageType<T extends (keyof LocalStorage)[]> = [Partial<ExtractKeysFromLocalStorage<T>>, (updates: Partial<ExtractKeysFromLocalStorage<T>>) => Promise<void>]

export function useLocalStorage<T extends (keyof LocalStorage)[]>(keys?: T): UseLocalStorageType<T> {
    if (!keys) {
        return useStorage(defaultLocalStorage, 'local') as UseLocalStorageType<T>
    }
    const obj = keys.reduce((acc, key) => {
        if (key in defaultLocalStorage) {
            acc[key] = defaultLocalStorage[key];
        }
        return acc;
    }, {} as Partial<Pick<LocalStorage, T[number]>>);
    return useStorage(obj, 'local') as UseLocalStorageType<T>
}

const getUpdates = <T extends object>(oldState: T, newState: Partial<T>): Partial<T> => {
    const updates = Object.entries(newState).reduce((acc, [key, value]) => {
        if (oldState[key] !== value) {
            acc[key] = value;
        }
        return acc;
    }, {} as Partial<T>);
    return updates;
}

export function useStorage<T extends object>(keysWithDefaults: T, storageArea: chrome.storage.AreaName = 'local'): [Partial<T>, (updates: Partial<T>) => Promise<void>] {
    const chooseKeys = keysWithDefaults ? Object.keys(keysWithDefaults) as (keyof T)[] : [];
    const [state, setState] = useState(pick(cache[storageArea], chooseKeys) as Partial<T>);

    const listener = useCallback((newState: T) => {
        const intersection = pick(newState, chooseKeys as (keyof T)[]);
    
        setState((prevState) => {
            if (!shallowEqual(prevState, intersection)) {
                return { ...prevState, ...intersection };
            }
            return prevState; // No change
        });
    }, [chooseKeys, setState]);

    useEffect(() => {
        if (chooseKeys.length == 0) return;
        consoleProxy.debug('looking for', chooseKeys, `in cache['${storageArea}']:`, cache[storageArea]);
        // if we can answer the request from cache, do so
        if (chooseKeys.every((key) => key in cache[storageArea])) {
            consoleProxy.debug('cache hit for', chooseKeys, `in cache['${storageArea}']:`, cache[storageArea]);
            return;
        }

        getStorage(storageArea, {...keysWithDefaults, ...cache[storageArea]}).then((response) => {
            cache[storageArea] = { ...cache[storageArea], ...response };
            consoleProxy.debug('setting state from cache:', pick(cache[storageArea], chooseKeys))
            setState(pick(cache[storageArea], chooseKeys));
        });
    }, [chooseKeys, storageArea, keysWithDefaults])

    useEffect(() => {
        proxyListeners[storageArea].push(listener);

        return () => {
            const index = proxyListeners[storageArea].indexOf(listener);
            if (index !== -1) {
                proxyListeners[storageArea].splice(index, 1);
            }
        }
    }, [keysWithDefaults])

    const setStateProxy = async (state: Partial<T>) => {
        const updates = getUpdates(cache[storageArea], state);

        if (Object.keys(updates).length > 0) {
            setState((prevState) => ({ ...prevState, ...updates }))

            consoleProxy.debug('setting local storage state with updates:', updates, 'from state:', state, 'previously cached', cache[storageArea])
            await setLocalStorage(updates);
        }
    }

    return [state, setStateProxy];
}
