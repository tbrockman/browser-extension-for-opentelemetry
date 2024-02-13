export enum MessageTypes {
    OTLPSendMessage,
}

export type PortMessage = | OTLPSendMessage

export interface PortMessageBase {
    type: MessageTypes
}

export interface TypedPort extends chrome.runtime.Port {
    postMessage: (message: PortMessage) => void
    onMessage: TypedMessageHandler
}

export interface TypedMessageHandler extends chrome.runtime.PortMessageEvent {
    addListener: (callback: (message: PortMessage, port: any) => void) => void
}

export interface OTLPSendMessage extends PortMessageBase {
    type: MessageTypes.OTLPSendMessage
    bytes: number[],
    timeout: number,
}