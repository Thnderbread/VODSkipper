import url from "node:url"
import path from "node:path"
import fs from "node:fs/promises"

import { browser } from "@wdio/globals"
import type { Options } from "@wdio/types"

import { config as baseConfig } from "./wdio.conf.js"
import pkg from "./package.json" assert { type: "json" }

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))
const chromeExtension = (
  await fs.readFile(
    path.join(__dirname, `vodskipper-chrome-v${pkg.version}.crx`),
  )
).toString("base64")
const firefoxExtensionPath = path.resolve(
  __dirname,
  `vodskipper-firefox-v${pkg.version}.xpi`,
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
    const extensionItem = await this.$(">>> extensions-item")

    const extId = await extensionItem.getAttribute("id")

    if (!extId) throw new Error("Couldn't find extension id.")
    await this.url(`chrome-extension://${extId}/popup/${popupUrl}`)
  } else if (browserName === "firefox") {
    await this.url("about:debugging#/runtime/this-firefox")
    // Give a second for stuff to load
    await new Promise(r => setTimeout(r, 2000))

    const extension = await this.$(`span=${extensionName}`)

    if (!extension) {
      throw new Error("Couldn't find the extension.")
    }

    const parent = await extension.$("..")
    const extIdContainer = await parent.$("dt=Internal UUID")
    const extIdParent = await extIdContainer.$("..")
    const extIdElement = await extIdParent.$("dd")
    const extId = await extIdElement.getText()

    if (!extId) {
      throw new Error("Couldn't find the extension id.")
    }
    await this.url(`moz-extension://${extId}/popup/${popupUrl}`)
  } else {
    throw new Error("This command only works for Chrome and Firefox.")
  }
}

async function enableExtensionPermissions(
  this: WebdriverIO.Browser,
  extensionName: string,
) {
  if (
    (this.capabilities as WebdriverIO.Capabilities).browserName !== "firefox"
  ) {
    throw new Error("This command only works with Firefox.")
  }

  await this.url("about:addons")
  // Give a second for stuff to lose
  await new Promise(r => setTimeout(r, 1000))

  const extensionButton = await this.$("span=Extensions")
  await extensionButton.click()

  const extension = await this.$(`a=${extensionName}`)
  if (!extension) throw new Error("Couldn't find your extension.")
  await extension.click()

  const permissions = await this.$("button=Permissions")
  await permissions.click()

  const permissionsContainer = await this.$("#permission-0")
  const permissionLabel = await permissionsContainer.shadow$("label")

  const toggleButton = await permissionLabel.$("button")
  await toggleButton.click()
}

async function lowerVideoQuality(this: WebdriverIO.Browser) {
  const settings = await this.$("[aria-label=Settings]")
  await settings.click()
  const quality = await this.$("div=Quality")
  await quality.click()

  const lowestOption = await this.$("div=160p")
  await lowestOption.click()

  // Wait a couple seconds
  await new Promise(resolve => setTimeout(resolve, 2000))
}

/**
 * In chrome specifically, the vod page needs
 * to be focused in order for messaging to work
 * properly. This will focus the vod window and then
 * reload the unfocused extension page, allowing the correct
 * information to be displayed and tested. The function
 * assumes that the page it's currently on the
 * extension page.
 *
 * @param {string} vodUrl The url of the vod to focus while the extension page is being reloaded.
 * @param {number} delay The amount of time to wait before reloading the vodPage.
 */
async function setupExtensionPopup(
  this: WebdriverIO.Browser,
  vodUrl: string,
  delay: number = 3000,
) {
  await this.execute(
    (url, delay) => {
      const extPage = window
      const secondWindow = window.open(url, "_blank")

      secondWindow?.focus()
      setTimeout(() => {
        extPage.location.reload()
      }, delay)
    },
    vodUrl,
    delay,
  )
}

declare global {
  namespace WebdriverIO {
    interface Browser {
      lowerVideoQuality: typeof lowerVideoQuality
      openExtensionPopup: typeof openExtensionPopup
      setupExtensionPopup: typeof setupExtensionPopup
      enableExtensionPermissions: typeof enableExtensionPermissions
    }
  }
}

const spec = process.argv.slice(-1).pop()
if (!spec) throw new Error("Missing spec.")

const specFiles = {
  CONTENT: ["./test/specs/content.spec.ts"],
  TIMEOUT: ["./test/specs/popup.timeout.spec.ts"],
  BACKGROUND: ["./test/specs/background.spec.ts"],
  SEGMENTS: ["./test/specs/popup.segments.spec.ts"],
  SERVERLESS: ["./test/specs/popup.serverless.spec.ts"],
}

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: specFiles[spec],
  logLevel: "trace",
  capabilities: [
    {
      browserName: "chrome",
      // browserVersion: "122.0.6261.39",
      "goog:chromeOptions": {
        // trying to optimize performance a bit
        // https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md
        args: [
          "--no-sandbox",
          "--disable-gpu",
          "--headless=new",
          "--disable-logging",
          "--disable-infobars",
          "--disable-default-apps",
          "--disable-audio-output",
          "--disable-dev-shm-usage",
        ],
        extensions: [chromeExtension],
      },
    },
    {
      browserName: "firefox",
      "moz:firefoxOptions": {
        args: [
          "-headless",
          "-disable-gpu",
          "-disable-audio",
          "-disable-webgpu",
          "-disable-webrender",
        ],
      },
    },
  ],
  before: async capabilities => {
    browser.addCommand("lowerVideoQuality", lowerVideoQuality)
    browser.addCommand("openExtensionPopup", openExtensionPopup)
    browser.addCommand("setupExtensionPopup", setupExtensionPopup)
    browser.addCommand("enableExtensionPermissions", enableExtensionPermissions)
    const browserName = (capabilities as WebdriverIO.Capabilities).browserName

    if (browserName === "firefox") {
      const extension = await fs.readFile(firefoxExtensionPath)
      await browser.installAddOn(extension.toString("base64"), true)
    }
  },
}
