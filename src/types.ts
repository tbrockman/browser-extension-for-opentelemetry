declare global {
    interface Window {
        __OTEL_BROWSER_EXT_INSTRUMENTED__: boolean
    }
}

export enum MessageTypes {
    OTLPTraceMessage = 'trace',
    OTLPLogMessage = 'log'
}

export type PortMessage = OTLPExportTraceMessage | OTLPExportLogMessage

export interface PortMessageBase {
    type: MessageTypes
}

export interface TypedPort<Send, Receive> extends chrome.runtime.Port {
    postMessage: (message: Send) => void
    onMessage: TypedMessageHandler<Receive>
}

export interface TypedMessageHandler<T> extends chrome.runtime.PortMessageEvent {
    addListener: (callback: (message: T, port: any) => void) => void
}

export interface OTLPExportTraceMessage extends PortMessageBase {
    type: MessageTypes.OTLPTraceMessage
    bytes: number[],
    timeout: number,
}

export interface OTLPExportLogMessage extends PortMessageBase {
    type: MessageTypes.OTLPLogMessage
    bytes: number[],
    timeout: number,
}

export type Options = {
    traceCollectorUrl: string
    logCollectorUrl: string
    headers: Record<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[],
    instrumentations: ('fetch' | 'load' | 'interaction')[],
    enabled: boolean,
    tracingEnabled: boolean,
    loggingEnabled: boolean,
}
