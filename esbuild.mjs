import { build } from "esbuild";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

await build({
    entryPoints: ["src/content-script.ts"],
    bundle: true,
    format: 'iife',
    globalName: '__bundled_content_script',
    outfile: "dist/content-script.js",
    plugins: [
        polyfillNode({
            // Options (optional)
            path: true,
        })
    ],
    target: ['chrome80', 'firefox80'],
    // banner: { js: 'function inject(extensionId, options) {var injectContentScript;' },
    footer: { js: 'let injectContentScript = __bundled_content_script.injectContentScript' }
});

// await build({
//     entryPoints: ["src/background.ts"],
//     outfile: "dist/index.js",
//     format: 'esm',
//     bundle: true,
//     plugins: []
// });