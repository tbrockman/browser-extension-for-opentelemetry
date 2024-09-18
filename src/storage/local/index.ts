import type { KeyValues, Values } from "~types"
import { de, ser } from "~utils/serde";
import { Configuration, type ConfigurationType } from "~storage/local/configuration";
import { InternalStorage, type InternalStorageType } from "./internal";
import { Mixin } from 'ts-mixer';

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

export async function setLocalStorage<T extends Partial<LocalStorage>>(data: T): Promise<void> {
    return await setStorage('local', data);
}

export type ExtractKeys<T extends (keyof LocalStorage)[] | undefined> = T extends undefined
    ? LocalStorage
    : Pick<LocalStorage, T[number]>;

export async function getLocalStorage<T extends (keyof LocalStorage)[] | undefined>(keys?: T): Promise<ExtractKeys<T>> {
    if (!keys) {
        return await getStorage('local', defaultLocalStorage) as ExtractKeys<T>;
    }

    const selectedStorage = keys.reduce((acc, key) => {
        acc[key] = defaultLocalStorage[key];
        return acc;
    }, {} as { [K in T[number]]: LocalStorage[K] });

    return await getStorage('local', selectedStorage) as ExtractKeys<T>;
}

export async function getStorage<T>(storageArea: chrome.storage.AreaName, keysWithDefaults: T): Promise<T> {
    const serializedDefaults = Object.entries(keysWithDefaults).reduce((acc, [key, value]) => {
        return { ...acc, [key]: ser(value) };
    }, {});
    return parseStorageResponse(await chrome.storage[storageArea].get(serializedDefaults)) as T;
}

export async function setStorage<T extends KeyValues>(storageArea: chrome.storage.AreaName, data: T): Promise<void> {
    const serialized = Object.entries(data).reduce((acc, [key, value]) => {
        return { ...acc, [key]: ser(value) };
    }, {});
    return await chrome.storage[storageArea].set(serialized);
}
