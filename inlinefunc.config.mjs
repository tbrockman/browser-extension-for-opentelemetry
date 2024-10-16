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
        'process.env.PLASMO_BROWSER': `"${process.env.PLASMO_BROWSER}"`,
        'process.env.PLASMO_PUBLIC_PACKAGE_VERSION': `"${process.env.PLASMO_PUBLIC_PACKAGE_VERSION}"`,
        'process.env.PLASMO_PUBLIC_PACKAGE_NAME': `"${process.env.PLASMO_PUBLIC_PACKAGE_NAME}"`,
    }
}