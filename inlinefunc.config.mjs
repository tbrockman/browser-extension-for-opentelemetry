import { polyfillNode } from "esbuild-plugin-polyfill-node";

const plugins = [
    polyfillNode({
        polyfills: {
            path: true,
            process: false,
        }
    })
]
const define = {
    global: 'undefined'
}

export {
    plugins,
    define
}