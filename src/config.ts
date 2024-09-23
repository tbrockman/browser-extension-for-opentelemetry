import { deepmerge } from "deepmerge-ts";
import { consoleProxy } from "~utils/logging";

interface Config {
    version: string | undefined
    name: string | undefined
}

const configs = {
    default: {
        version: process.env.PLASMO_PUBLIC_PACKAGE_VERSION,
        name: process.env.PLASMO_PUBLIC_PACKAGE_NAME,
    },
    production: {},
    development: {}
}

const config: Config = deepmerge(configs.default, configs[process.env.NODE_ENV ?? 'development'][process.env.PLASMO_BROWSER ?? 'chrome'])

export {
    config
}