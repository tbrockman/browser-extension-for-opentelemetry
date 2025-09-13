import type { ToBackgroundMessage, TypedPort, ToRelayMessage } from "~types";

let ports: Record<string, TypedPort<ToRelayMessage, ToBackgroundMessage>> = {};

export const addPort = (port: chrome.runtime.Port) => {
    const tabId = port.sender?.tab?.id?.toString()

    if (tabId) {
        ports[tabId] = port;
    }
}

export const removePort = (port: chrome.runtime.Port) => {
    const tabId = port.sender?.tab?.id?.toString()

    if (tabId) {
        delete ports[tabId];
    }
}

export const getPorts = () => ports;
