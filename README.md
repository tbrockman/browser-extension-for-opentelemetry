# opentelemetry-browser-extension

> [!NOTE] 
> This project is in very early development, and is likely to change *and* be broken. Forgive the lack of documentation.

A [Plasmo](https://docs.plasmo.com/) browser extension that automatically instruments webpages with [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/).

Download it, refresh your pages, and start sending OTLP traces (to a collector of your choosing) for user interactions, document loads and fetch/XHR requests.

<img src='./assets/store/popup.png' width='524' alt='An example view of the popup UI'/>

## Browser compatibility

Currently, this extension is only compatible with Chromium-based browsers (Chrome, Edge, etc) which support [manifest v3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3) and `chrome.scripting.executeScript({ world: 'MAIN' })`.

## Getting Started

Initialize submodules (we use a custom build of Plasmo):

```bash
git submodule update --init --recursive
```

Install dependencies:

```bash
pnpm install --shamefully-hoist
```

Run the development server:

```bash
pnpm dev
```

Then, open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

## Making production build

Run the following:

```bash
pnpm build
```

Then, load the appropriate build from the `build` directory, i.e: `build/chrome-mv3-prod`.
