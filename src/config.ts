import { deepmerge } from "deepmerge-ts";

interface Config {
    extension: {
        id: string
    }
}

const configs = {
    default: {

    },
    production: {
        chrome: {
            extension: {
                id: 'kmbocfeebaaljhpkponlmjamhfdeclch'
            }
        }
    },
    development: {
        chrome: {
            extension: {
                id: 'ekcjelbccmfijnglpcgfgkegjhgngeen'
            }
        }
    }
}

const config: Config = deepmerge(configs.default, configs[process.env.NODE_ENV ?? 'development'][process.env.BROWSER ?? 'chrome'])

export {
    config
}