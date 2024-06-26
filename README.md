# VODSkipper

An extension for automatically skipping the muted portions in Twitch vods.

## Development

### Setup

Install dependencies via:

```sh
npm install
```

Bundle the extension:

```sh
npm run bundle-dev
```

Start the dummy server:

```sh
npm run mocks
```

You can use make to switch the current collection set on the server:

```sh
make switch-collection COLLECTION=<desired-collection>
```

The available collections are 'segments' (default), 'server_timeout', and 'server_failure'.

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

This script will bundle the extension as `vodskipper-chrome-vX.X.X.crx` and `vodskipper-firefox-vX.X.X.zip`. The generated files are in `dist/`.

```sh
npm run load-dev:chrome
```

This script will run the build and start scripts sequentially.

#### Load in Firefox

To load the extension in Firefox go to `about:debugging#/runtime/this-firefox` or `Firefox > Preferences > Extensions & Themes > Debug Add-ons > Load Temporary Add-on...`. Here locate the `dist/` directory and open `manifestv2.json`

#### Load in Chrome

To load the extensions in Google Chrome go to `chrome://extensions/` and click `Load unpacked`. Locate the dist directory and select `manifest.json`.

Typically, bundle-dev will be sufficient and is preferred over build.

### Test

This project tests the extension files using the extension integration via e2e test with WebdriverIO.

Run all tests:

```sh
npm run test
```

This will bundle the extension before running all the tests sequentially.

Run specific tests:

```sh
npm run test:bg
npm run test:popup
npm run test:content
```

When making changes in-between tests, run:

```sh
npm run bundle-dev
```

To re-bundle the extension with your changes.

## Files

- popup/ - popup UI
- background/ - Background script/Service worker
- content-script/ - extension functionality (skipping)

If you have any questions, feel free to open an issue.
