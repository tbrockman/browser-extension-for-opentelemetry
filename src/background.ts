import { Storage } from '@plasmohq/storage'
import { stringHeadersToObject } from './util'
import { injectContentScript } from 'func:./content-script'

let storage = new Storage({ area: 'local' })
let ports = {}

const connected = async (p) => {
    console.debug('connected', p)

    ports[p.sender.tab.id] = p;

    p.onMessage.addListener((m) => {
        console.debug("received message from content script", m);
    });

    p.onDisconnect.addListener((p) => {
        console.debug('disconnected', p)
        delete ports[p.sender.tab.id];
    })
}

// #TODO: refactor and type
storage.watch({
    'url': (url: any) => {
        console.debug('url changed', url)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ url: url.newValue });
        })
    },
    'events': (events: any) => {
        console.debug('events changed', events)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ events: events.newValue });
        })
    },
    'telemetry': (telemetry: any) => {
        console.debug('telemetry changed', telemetry)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ telemetry: telemetry.newValue });
        })
    },
    'headers': (headers: any) => {
        console.debug('headers changed', headers)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ headers: headers.newValue });
        })
    },
    'enabled': (enabled: any) => {
        console.debug('enabled changed', enabled)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ enabled: enabled.newValue });
        })
    },
    'propagateTo': (propagateTo: any) => {
        console.debug('propagateTo changed', propagateTo)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ propagateTo: propagateTo.newValue });
        })
    },
    'instrumentations': (instrumentations: any) => {
        console.debug('instrumentations changed', instrumentations)
        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ instrumentations: instrumentations.newValue });
        })
    }
})

chrome.runtime.onConnectExternal.addListener(connected);
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.debug("tab updated", tabId, changeInfo, tab, tab.status)
    if (
        changeInfo.status === "complete") {
        console.debug("injecting opentelemetry-browser-extension")

        const options = {
            url: await storage.get('url'),
            headers: stringHeadersToObject(await storage.get('headers')),
            concurrencyLimit: 10,
            events: await storage.get<(keyof HTMLElementEventMap)[]>('events'),
            telemetry: await storage.get<('logs' | 'traces')[]>('telemetry'),
            propagateTo: await storage.get<string[]>('propagateTo'),
            instrumentations: await storage.get<('fetch' | 'load' | 'interaction')[]>('instrumentations'),
            enabled: await storage.get<boolean>('enabled'),
        }

        chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: injectContentScript,
            args: [
                chrome.runtime.id,
                options,
            ],
            injectImmediately: true,
            world: "MAIN"
        })
    }
})