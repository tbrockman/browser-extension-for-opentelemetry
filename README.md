# opentelemetry-browser-extension

> [!WARNING]

A [Plasmo](https://docs.plasmo.com/) browser extension that automatically instruments webpages with [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/).

Download it, refresh your pages, and start sending OTLP traces (to a collector of your choosing) for user interactions, document loads, HTTP requests, and more.

![An example view of the popup UI](./assets/store/popup.png)

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.
