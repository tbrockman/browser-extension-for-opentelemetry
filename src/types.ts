export enum MessageTypes {
    OTLPSendMessage,
}

export type PortMessage = | OTLPSendMessage

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

export interface OTLPSendMessage extends PortMessageBase {
    type: MessageTypes.OTLPSendMessage
    bytes: number[],
    timeout: number,
}

export type Options = {
    traceCollectorUrl: string
    logCollectorUrl: string
    headers: Record<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    telemetry: ('logs' | 'traces')[],
    propagateTo: string[],
    instrumentations: ('fetch' | 'load' | 'interaction')[],
    enabled: boolean,
    tracingEnabled: boolean,
    loggingEnabled: boolean,
}