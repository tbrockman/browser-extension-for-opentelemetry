import type { LocalStorageType } from "~storage/local"
import type { ContentScriptConfigurationType } from "~storage/local/configuration"

declare global {
    interface Window {
        __OTEL_BROWSER_EXT_INSTRUMENTATION__: (() => void) | undefined
    }
}

/**
 * Enumerates all messages sent between background, content scripts, and the relay.
 */
export enum MessageTypes {
    OTLPTraceMessage = 'trace',
    OTLPLogMessage = 'log',
    OTLPMetricMessage = 'metric',
    StorageChanged = 'storageChanged',
    ConfigurationChanged = 'configChanged',
    Disconnect = 'disconnect'
}

export type ToBackgroundMessage = OTLPExportTraceMessage | OTLPExportLogMessage | OTLPMetricMessage
export type ToRelayMessage = StorageChangedMessage
export type ToContentScriptMessage = ConfigurationChangedMessage | DisconnectMessage
export type CustomAppEvent = Omit<CustomEvent, 'detail'> & {
    detail: ToContentScriptMessage
}

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

export interface StorageChangedMessage extends PortMessageBase {
    type: MessageTypes.StorageChanged
    data: Partial<LocalStorageType>
}

export interface ConfigurationChangedMessage extends PortMessageBase {
    type: MessageTypes.ConfigurationChanged
    data: Partial<ContentScriptConfigurationType>
}

export interface DisconnectMessage extends PortMessageBase {
    type: MessageTypes.Disconnect
}

export type Primitive = string | number | boolean | null | undefined | object;
export type Values = Primitive | Primitive[] | KeyValueStructure

export type KeyValueStructure = {
    [key in string]: Values;
};

export type KeyValues = KeyValueStructure;