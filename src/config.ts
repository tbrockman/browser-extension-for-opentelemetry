import { deepmerge } from "deepmerge-ts";

interface Config {
    extension: {
        id: string
    }
}

const configs = {
    default: {
        extension: {
            id: 'kmbocfeebaaljhpkponlmjamhfdeclch'
        }
    },
    production: {
        chrome: {
            extension: {
                id: 'bgjeoaohfhbfabbfhbafjihbobjgniag'
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