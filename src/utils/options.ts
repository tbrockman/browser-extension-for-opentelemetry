export type MatchPatternError = {
    error: Error
    pattern: string
}

export type Options = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    metricsEnabled: boolean
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    metricsCollectorUrl: string
    attributes: Record<string, string>
    headers: Record<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
    matchPatternErrors: MatchPatternError[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
}


export const defaultOptions: Options = {
    enabled: true,
    tracingEnabled: true,
    loggingEnabled: true,
    metricsEnabled: true,
    matchPatterns: ['http://localhost/*'],
    traceCollectorUrl: 'http://localhost:4318/v1/traces',
    logCollectorUrl: 'http://localhost:4318/v1/logs',
    metricsCollectorUrl: 'http://localhost:4318/v1/metrics',
    headers: {
        'x-custom-header': 'test'
    },
    attributes: {
        'example': 'abc'
    },
    concurrencyLimit: 10,
    events: ['submit', 'click', 'keypress', 'scroll', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'],
    propagateTo: [],
    instrumentations: ['fetch', 'load', 'interaction'],
    matchPatternErrors: [],
}