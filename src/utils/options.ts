import type { Storage } from "@plasmohq/storage"

type MatchPatternError = {
    error: Error
    pattern: string
}

type Options = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    metricsEnabled: boolean
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    metricsCollectorUrl: string
    attributes: Map<string, string>
    headers: Map<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
    matchPatternErrors: MatchPatternError[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
}

const defaultOptions: Options = {
    enabled: true,
    tracingEnabled: true,
    loggingEnabled: true,
    metricsEnabled: true,
    matchPatterns: ['http://localhost/*'],
    traceCollectorUrl: 'http://localhost:4318/v1/traces',
    logCollectorUrl: 'http://localhost:4318/v1/logs',
    metricsCollectorUrl: 'http://localhost:4318/v1/metrics',
    headers: new Map([
        ['x-custom-header', 'test']
    ]),
    attributes: new Map([
        ['example', 'abc']
    ]),
    concurrencyLimit: 10,
    events: ['submit', 'click', 'keypress', 'scroll', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'],
    propagateTo: [],
    instrumentations: ['fetch', 'load', 'interaction'],
    matchPatternErrors: [],
}

const getOptions = async (storage: Storage): Promise<Options> => {
    const result = await Promise.all(Object.keys(defaultOptions).map(async (key) => {
        return [key, await storage.get(key) || defaultOptions[key]]
    }))
    return Object.fromEntries(result)
}

export {
    defaultOptions,
    getOptions,
}

export type {
    MatchPatternError,
    Options
}