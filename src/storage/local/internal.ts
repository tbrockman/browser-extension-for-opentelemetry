import type { KeyValues } from "~types"
import { defaultUserFacingConfiguration } from "./configuration"
import { ser } from "~utils/serde"

export type MatchPatternError = {
    error: string
    pattern: string
}

export enum ConfigMode {
    Visual = 'visual',
    Code = 'code'
}

// Data in LocalStorage used internally by the extension
export type InternalStorageType = {
    matchPatternErrors: MatchPatternError[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
    configMode: 'visual' | 'code'
    configText: string
    editorState?: KeyValues
}

export class InternalStorage implements InternalStorageType {
    matchPatternErrors: MatchPatternError[] = []
    traceExportErrors?: string[] = [] // TODO:
    logExportErrors?: string[] = [] // TODO:
    metricExportErrors?: string[] = [] // TODO:
    configMode = ConfigMode.Visual
    configText = ser(defaultUserFacingConfiguration, true)
    editorState: KeyValues = null
}

export const defaultInternalStorage = new InternalStorage();