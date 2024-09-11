export type MatchPatternError = {
    error: string
    pattern: string
}

// Data in LocalStorage used internally by the extension
export type InternalStorageType = {
    matchPatternErrors: MatchPatternError[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
    configMode: 'visual' | 'code'
    configText: string
}

export class InternalStorage implements InternalStorageType {
    matchPatternErrors: MatchPatternError[] = []
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
    configMode: 'visual' | 'code' = 'visual'
    configText: string = ''
}

export const defaultInternalStorage = new InternalStorage();