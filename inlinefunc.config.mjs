import { polyfillNode } from "esbuild-plugin-polyfill-node";

console.log('process.env.NODE_ENV', process.env.NODE_ENV, 'process.env.PLASMO_BROWSER', process.env.toString())

export default {
    plugins: [
        polyfillNode({
            polyfills: {
                path: true,
                process: false,
            }
        })
    ],
    define: {
        global: 'undefined',
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`
    }
}