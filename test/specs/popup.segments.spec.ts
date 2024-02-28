import { browser, $, expect } from "@wdio/globals"
import { SEGMENTS, mutedVodUrl, unmutedVodUrl } from "../fixtures/vodStuff.js"

describe("VODSkipper popup tests for number of segments", () => {
  let browserName = (browser.capabilities as WebdriverIO.Capabilities)
    .browserName
  before(async () => {
    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    } else if (browserName === "chrome") {
      await browser.url("https://google.com")
    }
  })

  it("Shows that no muted segments are found for the vod", async () => {
    const extWindow = await browser.getWindowHandle()
    await browser.openExtensionPopup("VodSkipper")

    await browser.setupExtensionPopup(unmutedVodUrl)
    await new Promise(r => setTimeout(r, 5000))
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
        timeout: 10000,
        timeoutMsg: `[${browserName} browser]: Text still stays "Loading..." after 10s.`,
      },
    )
    const headerText = await headerEl.getText()
    const message = await messageEl.getText()

    expect(headerText).toMatch("VODSkipper")
    expect(message).toMatch("This vod has no muted segments.")
  })

  it("Shows the correct number of muted segments for the vod", async () => {
    const extWindowHandle = await browser.getWindowHandle()
    const handles = await browser.getWindowHandles()
    const vodWindowHandle = handles.find(handle => handle !== extWindowHandle)

    await browser.switchToWindow(vodWindowHandle!)
    await browser.closeWindow()
    await browser.switchToWindow(extWindowHandle)

    await browser.setupExtensionPopup(mutedVodUrl)
    await new Promise(r => setTimeout(r, 5000))
    await browser.switchToWindow(extWindowHandle)

    const headerEl = await $("h1")
    const messageEl = await $("p")

    await headerEl.waitForExist({ timeout: 5000 })
    await messageEl.waitForExist({ timeout: 5000 })

    await browser.waitUntil(
      async () => {
        return (await messageEl.getText()) !== "Loading..."
      },
      {
        timeout: 10000,
        timeoutMsg: `[${browserName} browser]: Text still stays "Loading..." after 10s.`,
      },
    )
    const headerText = await headerEl.getText()
    const message = await messageEl.getText()

    expect(headerText).toMatch("VODSkipper")
    expect(message).toMatch(`This vod has ${SEGMENTS.length} muted segments.`)
  })
})
