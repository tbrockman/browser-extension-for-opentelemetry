import type { KeyValues, Values } from "~types"
import { de, ser } from "./serde"

export type MatchPatternError = {
    error: string
    pattern: string
}

// Settings available in LocalStorage which are exposed to the end user
// and can be modified as they desire
export type ConfigurationType = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    metricsEnabled: boolean
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    metricCollectorUrl: string
    attributes: Map<string, string>
    headers: Map<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
}

// Data in LocalStorage used internally by the extension
// But which isn't exposed to the end user
export type InternalStorage = {
    matchPatternErrors: MatchPatternError[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
    configMode: 'visual' | 'code'
    configText: string
}

export type LocalStorageType = ConfigurationType & InternalStorage
export type MapOrRecord = Map<string, string> | Record<string, string>
export type LocalStorageProps = Partial<LocalStorageType> & { headers?: MapOrRecord, attributes?: MapOrRecord }
export class Configuration implements ConfigurationType {
    enabled = true;
    tracingEnabled = true;
    loggingEnabled = true;
    metricsEnabled = true;
    matchPatterns = ['http://localhost/*'];
    traceCollectorUrl = 'http://localhost:4318/v1/traces';
    logCollectorUrl = 'http://localhost:4318/v1/logs';
    metricCollectorUrl = 'http://localhost:4318/v1/metrics';
    headers = new Map([
        ['x-example-header', 'value']
    ]);
    attributes = new Map([
        ['key', 'value']
    ]);
    concurrencyLimit = 50;
    events = ['submit', 'click', 'keypress', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'] as (keyof HTMLElementEventMap)[];
    propagateTo = [];
    instrumentations = ['fetch', 'load', 'interaction'] as ("load" | "fetch" | "interaction")[];

    constructor({ headers, attributes, ...params }: LocalStorageProps = {}) {
        console.log('constructor being called at all ever?', headers, attributes, params)
        if (headers instanceof Map) {
            this.headers = headers;
        } else if (typeof headers == 'object') {
            this.headers = new Map(Object.entries(headers));
        }

        if (attributes instanceof Map) {
            this.attributes = attributes;
        } else if (typeof this.attributes == 'object') {
            this.attributes = new Map(Object.entries(this.attributes));
        }

        Object.entries(this).forEach(([key, value]) => {

            if (params.hasOwnProperty(key)) {
                this[key] = params[key];
            }
        })
        console.log('after being constructed', this)
    }
}

export class LocalStorage extends Configuration implements LocalStorageType {
    matchPatternErrors = [];
    configMode = 'visual' as 'visual' | 'code';
    configText = ser(this, true);
}

export const defaultLocalStorage = new LocalStorage();

function parseStorageResponse(response: Record<string, Values>): Record<string, Values> {
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

