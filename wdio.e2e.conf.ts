import url from "node:url"
import path from "node:path"
import fs from "node:fs/promises"

import { browser } from "@wdio/globals"
import type { Options } from "@wdio/types"

import pkg from "./package.json" assert { type: "json" }
import { config as baseConfig } from "./wdio.conf.js"

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))
const chromeExtension = (
  await fs.readFile(
    path.join(__dirname, `web-extension-chrome-v${pkg.version}.crx`),
  )
).toString("base64")
const firefoxExtensionPath = path.resolve(
  __dirname,
  `web-extension-firefox-v${pkg.version}.xpi`,
)

async function openExtensionPopup(
  this: WebdriverIO.Browser,
  extensionName: string,
  popupUrl = "index.html",
) {
  const browserName = (this.capabilities as WebdriverIO.Capabilities)
    .browserName

  if (browserName === "chrome") {
    await this.url("chrome://extensions/")

    // The method outlined here: https://webdriver.io/docs/extension-testing/web-extensions/#chrome
    // did not work when initially attempted. Since vodskipper is the only extension installed during
    // tests, went with this workaround instead.
    const extensionsManager = await this.$("extensions-manager")
    const extensionItemList = await extensionsManager.shadow$(
      "extensions-item-list",
    )
    const extensionItem = await extensionItemList.shadow$("extensions-item")
    const extId = await extensionItem.getAttribute("id")

    if (!extId) {
      throw new Error("Couldn't find extension id.")
    }
    await this.url(`chrome-extension://${extId}/popup/${popupUrl}`)
  } else if (browserName === "firefox") {
    await this.url("about:debugging#/runtime/this-firefox")
    // Give a second for stuff to load
    await new Promise(r => setTimeout(r, 2000))

    const extensions = await this.$$(`span=${extensionName}`)
    const extension: WebdriverIO.Element = await extensions.find(
      async ext => (await ext.getText()) === extensionName,
    )

    if (!extension) {
      throw new Error("Couldn't find the extension.")
    }

    const parent = await extension.$("..")
    const extIdContainer = await parent.$("dt=Internal UUID")
    const extIdParent = await extIdContainer.$("..")
    const extIdRaw = await extIdParent.$("dd")
    const extId = await extIdRaw.getText()

    if (!extId) {
      throw new Error("Couldn't find the extension id.")
    }
    await this.url(`moz-extension://${extId}/popup/${popupUrl}`)
  } else {
    throw new Error("This command only works for Chrome and Firefox.")
  }
}

declare global {
  namespace WebdriverIO {
    interface Browser {
      openExtensionPopup: typeof openExtensionPopup
    }
  }
}

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ["./e2e/**/*.e2e.ts"],
  capabilities: [
    {
      browserName: "chrome",
      "goog:chromeOptions": {
        args: ["--headless=new"],
        extensions: [chromeExtension],
      },
    },
    {
      browserName: "firefox",
      "moz:firefoxOptions": {
        // args: ["-headless"],
      },
    },
  ],
  before: async capabilities => {
    browser.addCommand("openExtensionPopup", openExtensionPopup)
    const browserName = (capabilities as WebdriverIO.Capabilities).browserName

    if (browserName === "firefox") {
      const extension = await fs.readFile(firefoxExtensionPath)
      await browser.installAddOn(extension.toString("base64"), true)
    }
  },
}
