import type { ToBackgroundMessage, TypedPort, ToRelayMessage } from "~types";

let ports: Record<string, TypedPort<ToRelayMessage, ToBackgroundMessage>> = {};

export const addPort = (port: chrome.runtime.Port) => {
    ports[port.sender.tab.id?.toString()] = port;
}

export const removePort = (port: chrome.runtime.Port) => {
    delete ports[port.sender.tab.id?.toString()];
}

export const getPorts = () => ports;