import { logPrefix } from "./constants";

const noop = (...args) => { }

export const consoleProxy = {
    log: process.env.NODE_ENV !== 'production' ? console.log.bind(console, logPrefix) : noop,
    debug: process.env.NODE_ENV !== 'production' ? console.debug.bind(console, logPrefix) : noop,
    info: process.env.NODE_ENV !== 'production' ? console.info.bind(console, logPrefix) : noop,
    warn: console.warn.bind(console, logPrefix),
    error: console.error.bind(console, logPrefix)
}
