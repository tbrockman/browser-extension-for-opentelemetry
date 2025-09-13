import { deepmerge } from "deepmerge-ts";

interface Config {
    version: string | undefined
    name: string | undefined
    otelSdkVersion: string | undefined
}

const configs = {
    default: {
        version: process.env.PLASMO_PUBLIC_PACKAGE_VERSION,
        name: process.env.PLASMO_PUBLIC_PACKAGE_NAME,
        otelSdkVersion: process.env.PLASMO_PUBLIC_OTEL_SDK_VERSION
    },
    production: {},
    development: {}
}

const config: Config = deepmerge(configs.default, configs[process.env.NODE_ENV ?? 'development'][process.env.PLASMO_BROWSER ?? 'chrome'])

export {
    config
}