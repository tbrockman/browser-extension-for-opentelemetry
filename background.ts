import { Storage } from '@plasmohq/storage'

let storage = new Storage({ area: 'local' })
let ports = {}

const connected = (p) => {
    console.debug('connected', p)

    ports[p.sender.tab.id] = p;

    p.onMessage.addListener((m) => {
        console.log("In background script, received message from content script");
        console.log(m.greeting);
    });

    p.onDisconnect.addListener((p) => {
        console.log('disconnected', p)
        delete ports[p.sender.tab.id];
    })

    setTimeout(() => {
        p.postMessage({ greeting: "hi there content script!" });
    }, 2000)
}

storage.watch({
    'url': (url: any) => {
        console.log('url changed', url)

        Object.keys(ports).forEach((k) => {
            ports[k].postMessage({ url });
        })
    }
})

chrome.runtime.onConnectExternal.addListener(connected);
// chrome.storage.onChanged.addListener((changes, namespace) => {
//     console.log(changes, namespace)
// })