import { build } from "esbuild";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

await build({
    entryPoints: ["src/content-script.ts"],
    bundle: true,
    format: 'iife',
    outfile: "dist/content-script.js",
    plugins: [
        polyfillNode({
            // Options (optional)
            path: true
        })
    ],
    banner: { js: 'function inject(extensionId, options) {var injectContentScript;' },
    footer: { js: 'injectContentScript(extensionId, options)};' }
});

await build({
    entryPoints: ["src/background.ts"],
    outfile: "dist/index.js",
    format: 'esm',
    bundle: true,
    plugins: []
});