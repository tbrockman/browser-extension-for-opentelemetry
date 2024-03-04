import { polyfillNode } from "esbuild-plugin-polyfill-node";

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
        global: 'undefined'
    }
}