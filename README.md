<div align='center'>
    <img src='assets/logo.svg'></img>
    <p></p>
    <p>Automatically instrument webpages to emit <a href="https://opentelemetry.io/docs/what-is-opentelemetry/">OpenTelemetry</a>.</p>
    <p></p>
    <a href="https://chromewebstore.google.com/detail/opentelemetry-browser-ext/bgjeoaohfhbfabbfhbafjihbobjgniag"><img src='./assets/chrome.svg' height=50 alt='chrome download'></img></a>
    /
    <a href="https://apps.apple.com/us/app/opentelemetry-browser-ext/id6503631744"><img src='./assets/safari.svg' height=50 alt='safari download'></img></a>
    /
    <a href="https://microsoftedge.microsoft.com/addons/detail/opentelemetry-browser-ext/agbimhpapcebokbphphbfcimebibcoga"><img src='./assets/edge.svg' height=50 alt='edge download'></img></a>
    /
    <a href="https://addons.mozilla.org/en-US/firefox/addon/opentelemetry-browserextension/"><img src='./assets/firefox.svg' height=50 alt='firefox nightly download'></img></a>
    <p>...or <a href='#making-a-production-build'>build it yourself!</a></p>
    <video src='https://github.com/user-attachments/assets/8bc930b5-021d-4e79-bc05-2f0c6a138806' width=640/></video>
</div>

## About

> [!NOTE]
> This project is in early development. Please forgive (or feel free to contribute) any missing documentation.
> The extension is largely similar to the archived [opentelemetry-browser-extension](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/archive/opentelemetry-browser-extension-autoinjection) (by [@svrnm](https://github.com/svrnm/opentelemetry-browser-extension/)), but avoids CSP issues with a different content script injection method, offers more configuration, and was developed independently.

Download it, choose where you want it to run, and refresh your webpages to start emitting OTLP logs and traces.

## Features

- Automatically instrument webpages to collect traces and logs, sent to an OTLP-compatible collector
- No content-security policy errors! Works around typical CSP limitations by making `fetch` requests from the background script instead of the webpage
- Choose where and how you want it to run! Don't worry about the extension tracking every single webpage, use [match patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns) (ex. `https://<your-org-here>.com/*`) to specify the pages it should run on and have access to.
- Propagate b3 and w3c trace context to websites of your choosing (matched by regular expressions)

## Browser compatibility

This extension is compatible with [all major browsers](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript#browser_compatibility) as of Firefox 128! 🎉

<!-- ## Architecture TODO: -->
<!-- ## Performance impact TODO: -->

## Security considerations

> [!WARNING]
> You probably shouldn't run this extension on webpages you don't trust

### Why?

The extension background script exports any Protobuf-encoded OTLP data that it receives from the injected content script that it's able to parse.

While some mitigations are implemented, the data can always be tampered with by any malicious Javascript running in the same context as the content script, and as such the integrity of the data cannot be guaranteed. This may result in minor frustrations like storing garbage or worse depending on how your backend decodes Protobuf data.

So, just as a general safety measure, it's probably best if you don't allow the extension to run in untrusted pages.

### Can it be fixed?

Probably not in the near future. Unless browsers expose telemetry themselves, there's no way for the instrumentation to both run in an isolated context as well as gather the desired data.

## Developing

Clone the repository:

```bash
git clone https://github.com/tbrockman/browser-extension-for-opentelemetry
```

Install dependencies:

```bash
pnpm install
```

Start the OpenTelemetry stack (Grafana + Quickwit + `opentelemetry-collector-contrib`):<sup> (optional if you have your own)</sup>

```bash
docker compose up -d
```

Run the development server:

```bash
pnpm dev
# or for targetting a browser other than Chrome (the default)
pnpm dev --target=edge-mv3
```

Then, open your browser and load the appropriate development build. For example, if you're developing for Chrome, using manifest v3, use: `build/chrome-mv3-dev`.

## Making a production build

Run the following:

```bash
pnpm build
```

or, for targeting a specific browser:

```bash
pnpm build:chrome
# or
pnpm build:safari
# or
pnpm build:edge
# or
pnpm build:firefox
```

Then, follow the same steps as with running the development server, but load the appropriate production build from the `build` directory, i.e: `build/chrome-mv3-prod`.

### Safari

Safari requires a bit of extra work. After building the extension, run the following commands to convert the extension to a an XCode project:

```bash
pnpm convert:safari
```

Then, build the extension in XCode (using the MacOS target), and enable it in Safari.

> [!NOTE]
> Safari requires extensions to be signed before they can be installed. You can either sign the extension yourself, or load it as an unsigned extension after enabling "allow unsigned extensions" in Safari's developer settings.
