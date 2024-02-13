import { deepmerge } from "deepmerge-ts";

interface Config { }

const configs = {
    default: {},
    production: {},
    development: {}
}

const config: Config = deepmerge(configs.default, configs[process.env.NODE_ENV ?? 'development'][process.env.BROWSER ?? 'chrome'])

export {
    config
}