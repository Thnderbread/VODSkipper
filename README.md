# VODSkipper

An extension for automatically skipping the muted portions in Twitch vods.

## Development

### Setup

Install dependencies via:

```sh
npm install
```

start the dummy server:

```sh
npm run mocks
```

then start a browser with the web extension installed:

```sh
# run Chrome
npm run start-dev:chrome
```

or

```sh
# run Firefox
npm run start-dev:firefox
```

### Build

Bundle the extension by running:

```sh
npm run build
```

This script will bundle the extension as `web-extension-chrome-vX.X.X.crx` and `web-extension-firefox-vX.X.X.zip`. The generated files are in `dist/`.

```sh
npm run load-dev:chrome
```

This script will run the build and start scripts sequentially.

#### Load in Firefox

To load the extension in Firefox, go to `about:debugging#/runtime/this-firefox` or `Firefox > Preferences > Extensions & Themes > Debug Add-ons > Load Temporary Add-on...`. Here, locate the `dist/` directory and open `manifestv2.json`.

#### Load in Chrome

To load the extension in Google Chrome, go to `chrome://extensions/` and click `Load unpacked`. Locate the dist directory and select `manifest.json`.

### Test

This project tests the extension files using the extension integration via e2e test with WebdriverIO.

Run all tests:

```sh
npm run test
```

This will bundle the extension before running all the tests sequentially.

Run specific tests:

```sh
npm run test:popup
npm run test:content
npm run test:background
```

When making changes in-between tests, run:

```sh
npm run bundle-dev
```

To re-bundle the extension with your changes.

## Files

- popup/ - popup UI
- background/ - Background script/Service worker
- content-script/ - extension functionality (actually skipping)

If you have any questions, feel free to open an issue.
