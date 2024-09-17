import { logPrefix } from "./constants";

const noop = (...args) => { }

export const consoleProxy = {
    log: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop
}

function init() {
    consoleProxy.warn = console.warn.bind(console, logPrefix)
    consoleProxy.error = console.error.bind(console, logPrefix)

    if (process.env.NODE_ENV !== 'production') {
        consoleProxy.log = console.log.bind(console, logPrefix)
        consoleProxy.debug = console.debug.bind(console, logPrefix)
        consoleProxy.info = console.info.bind(console, logPrefix)
    }
}
init();