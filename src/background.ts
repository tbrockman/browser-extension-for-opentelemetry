import { Storage } from '@plasmohq/storage'

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

    const url = await storage.get('url')
    const events = await storage.get('events')
    const telemetry = await storage.get('telemetry')
    const headers = await storage.get('headers')

    p.postMessage({ url, events, telemetry, headers });
}

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
    }
})

chrome.runtime.onConnectExternal.addListener(connected);