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
        global: 'undefined',
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
        // 'process.env.PLASMO_BROWSER': `"${process.env.PLASMO_BROWSER}"`,
        'process.env.npm_package_version': `"${process.env.npm_package_version}"`,
    }
}