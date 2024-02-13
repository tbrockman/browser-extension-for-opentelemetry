export enum MessageTypes {
    OTLPSendMessage,
}

export interface PortMessage {
    type: MessageTypes
}

export interface TypedPort extends chrome.runtime.Port {
    postMessage: (message: PortMessage) => void
    onMessage: TypedMessageHandler
}

export interface TypedMessageHandler extends chrome.runtime.PortMessageEvent {
    addListener: (callback: (message: PortMessage, port: any) => void) => void
}

export interface OTLPSendMessage extends PortMessage {
    type: MessageTypes.OTLPSendMessage
    body: any,
    headers: any,
    url: string,
    timeout: number,
}