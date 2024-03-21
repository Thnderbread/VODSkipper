import { browser, $, expect } from "@wdio/globals"
import { mutedVodUrl } from "../fixtures/vodStuff.js"

describe("VODSkipper popup tests on server timeout", () => {
  let browserName = (browser.capabilities as WebdriverIO.Capabilities)
    .browserName
  before(async () => {
    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    } else if (browserName === "chrome") {
      await browser.url("https://google.com")
    }
  })

  it("Should display the server timeout message", async () => {
    const extWindow = await browser.newWindow("")
    await browser.openExtensionPopup("VodSkipper")

    await browser.setupExtensionPopup(mutedVodUrl)
    // Give extra time to allow things to load properly
    await new Promise(resolve => setTimeout(resolve, 5000))
    await browser.switchToWindow(extWindow)

    const headerEl = await $("h1")
    const messageEl = await $("p")

    await headerEl.waitForExist({ timeout: 5000 })
    await messageEl.waitForExist({ timeout: 5000 })

    await browser.waitUntil(
      async () => {
        return (await messageEl.getText()) !== "Loading..."
      },
      {
        timeout: 20000,
        interval: 5000,
        timeoutMsg: `[${browserName} browser]: Text still stays "Loading..." after 15s.`,
      },
    )
    const headerText = await headerEl.getText()
    const message = await messageEl.getText()

    expect(headerText).toMatch("VODSkipper")
    expect(message).toMatch("Server request timed out.")
  })
})
