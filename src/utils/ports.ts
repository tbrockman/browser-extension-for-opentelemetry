let ports = {};

export const addPort = (port: chrome.runtime.Port) => {
    ports[port.sender.tab.id] = port;
}

export const removePort = (port: chrome.runtime.Port) => {
    delete ports[port.sender.tab.id];
}

export const getPorts = () => ports;