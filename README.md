# opentelemetry-browser-extension

> [!NOTE] 
> This project is in very early development, and is likely to change abruptly *and* be broken. Forgive any missing documentation.

A [Plasmo](https://docs.plasmo.com/) browser extension that automatically instruments webpages with [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/).

[Download it](https://chromewebstore.google.com/detail/opentelemetry-browser-ext/bgjeoaohfhbfabbfhbafjihbobjgniag), refresh your pages, and start recording OTLP logs and traces in your browser.

## Preview

<img src='./assets/store/popup.png' width='524' alt='An example view of the popup UI'/>

## Download

| Browser | Link |
|-|-|
|Chrome|[Download it from the Chrome web store](https://chromewebstore.google.com/detail/opentelemetry-browser-ext/bgjeoaohfhbfabbfhbafjihbobjgniag)|

## Features

* Automatically instrument your webpages to collect traces and logs, sent to an OTLP-compatible collector
* No content-security policy errors! Works around typical CSP limitations by making `fetch` requests from the background script instead of the webpage
* Propagate b3 and w3c trace context to websites of your choosing (matched by regular expressions)


## Browser support

Currently, this extension has only been confirmed to work with compatible Chromium-based browsers (Chrome, Edge, etc) which support [manifest v3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3) and `chrome.scripting.executeScript({ world: 'MAIN' })`.

## Getting Started

Initialize submodules (we use a custom build of Plasmo):

```bash
git submodule update --init --recursive
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
```

Then, open your browser and load the appropriate development build. For example, if you're developing for Chrome, using manifest v3, use: `build/chrome-mv3-dev`.

## Making production build

Run the following:

```bash
pnpm build
```

Then, follow the same steps as with running the development server, but load the appropriate production build from the `build` directory, i.e: `build/chrome-mv3-prod`.
