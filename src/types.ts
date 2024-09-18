declare global {
    interface Window {
        __OTEL_BROWSER_EXT_INSTRUMENTATION__: () => void
    }
}

export enum MessageTypes {
    OTLPTraceMessage = 'trace',
    OTLPLogMessage = 'log',
    OTLPMetricMessage = 'metric',
}

export type PortMessage = OTLPExportTraceMessage | OTLPExportLogMessage | OTLPMetricMessage

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
}

export interface OTLPExportLogMessage extends PortMessageBase {
    type: MessageTypes.OTLPLogMessage
    bytes: number[],
}

export interface OTLPMetricMessage extends PortMessageBase {
    type: MessageTypes.OTLPMetricMessage
    bytes: number[],
}

export type Primitive = string | number | boolean | null | undefined | object;
export type Values = Primitive | Primitive[] | KeyValueStructure

export type KeyValueStructure = {
    [key in string]: Values;
};

export type KeyValues = KeyValueStructure;