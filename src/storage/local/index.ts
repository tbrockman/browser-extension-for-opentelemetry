import type { KeyValues, Values } from "~types"
import { de, ser } from "~utils/serde";
import { Configuration, type ConfigurationType } from "~storage/local/configuration";
import { InternalStorage, type InternalStorageType } from "./internal";
import { Mixin } from 'ts-mixer';
import { consoleProxy } from "~utils/logging";

export type LocalStorageType = ConfigurationType & InternalStorageType;
export class LocalStorage extends Mixin(Configuration, InternalStorage) implements LocalStorageType { }
export const defaultLocalStorage = new LocalStorage();

export const parseStorageResponse = (response: Record<string, Values>): Record<string, Values> => {
    return Object.entries(response).reduce((acc, [key, value]) => {

        if (typeof value !== 'string') {
            return { ...acc, [key]: value };
        }
        else {
            try {
                return { ...acc, [key]: de(value) };
            } catch (e) {
                return { ...acc, [key]: value };
            }
        }
    }, {});
}

export async function removeLocalStorage(keys: (keyof LocalStorage)[]): Promise<void> {
    consoleProxy.debug(`removing local storage`, { keys });
    return await chrome.storage.local.remove(keys);
}

export async function setLocalStorage<T extends Partial<LocalStorage>>(data: T): Promise<void> {
    return await setStorage('local', data);
}

export type ExtractLocalStorageKeys<T extends (keyof LocalStorage)[] | undefined> = ExtractKeysFrom<T, LocalStorage>;

export type ExtractKeysFrom<T extends (keyof K)[] | undefined, K> = T extends (keyof K)[]
    ? Pick<K, T[number]>
    : K;

export async function getLocalStorage<T extends (keyof LocalStorage)[] | undefined>(keys?: T): Promise<ExtractLocalStorageKeys<T>> {
    if (!keys) {
        return await getStorage('local', defaultLocalStorage) as ExtractLocalStorageKeys<T>;
    }

    const selectedStorage = keys.reduce((acc, key) => {
        acc[key] = defaultLocalStorage[key];
        return acc;
    }, {} as Partial<Record<keyof LocalStorage, LocalStorage[keyof LocalStorage]>>);

    return await getStorage('local', selectedStorage) as ExtractLocalStorageKeys<T>;
}

export async function getStorage<T extends Record<string, any>>(storageArea: chrome.storage.AreaName, keysWithDefaults: T): Promise<T> {
    const serializedDefaults = Object.entries(keysWithDefaults).reduce((acc, [key, value]) => {
        return { ...acc, [key]: ser(value) };
    }, {});
    consoleProxy.debug(`getting storage`, { storageArea, keysWithDefaults, serializedDefaults });
    const parsed = parseStorageResponse(await chrome.storage[storageArea].get(serializedDefaults)) as T;
    consoleProxy.debug(`got storage`, parsed);
    return parsed;
}

export async function setStorage<T extends KeyValues>(storageArea: chrome.storage.AreaName, data: T): Promise<void> {
    const serialized = Object.entries(data).reduce((acc, [key, value]) => {
        return { ...acc, [key]: ser(value) };
    }, {});
    consoleProxy.debug(`setting storage`, { storageArea, data, serialized });
    return await chrome.storage[storageArea].set(serialized);
}
