export type MatchPatternError = {
    error: Error
    pattern: string
}

export type StoredOptions = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    metricsEnabled: boolean
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    metricsCollectorUrl: string
    headers: string[]
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
    matchPatternErrors: MatchPatternError[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
}

export type Options = Omit<StoredOptions, "headers"> & {
    headers: Record<string, string>
}

export const defaultOptions: StoredOptions = {
    enabled: true,
    tracingEnabled: true,
    loggingEnabled: true,
    metricsEnabled: true,
    matchPatterns: ['http://localhost/*'],
    traceCollectorUrl: 'http://localhost:4318/v1/traces',
    logCollectorUrl: 'http://localhost:4318/v1/logs',
    metricsCollectorUrl: 'http://localhost:4318/v1/metrics',
    headers: [],
    concurrencyLimit: 10,
    events: ['submit', 'click', 'keypress', 'scroll', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'],
    propagateTo: [],
    instrumentations: ['fetch', 'load', 'interaction'],
    matchPatternErrors: [],
}