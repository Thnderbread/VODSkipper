import { browser, $$, $, expect } from "@wdio/globals"
import type { Capabilities } from "@wdio/types"

const isFirefox =
  (browser.capabilities as WebdriverIO.Capabilities).browserName === "firefox"

const mutedVodID = "1409109247"
const unmutedVodID = "2050655749"

const mutedVodUrl = `https://www.twitch.tv/videos/${mutedVodID}`
const unmutedVodUrl = `https://www.twitch.tv/videos/${unmutedVodID}`

describe("Web Extension e2e test", () => {
  it("should have injected the component from the content script", async () => {
    await browser.openExtensionPopup("VodSkipper")
    const headerEl = await $("h1")
    const messageEl = await $("p")

    const headerText = await headerEl.getText()
    const initialMessage = await messageEl.getText()

    await expect(headerText).toMatch("VODSkipper")
    await expect(initialMessage).toMatch("Loading...")

    await new Promise(r => setTimeout(r, 2000))

    const regularMessage = await messageEl.getText()

    await expect(regularMessage).toMatch(
      "No vod detected. VODSkipper not running",
    )
  })

  // it("can get cat facts", async () => {
  //   const extensionRoot = await $("#extension-root")
  //   const getCatFactBtn = await extensionRoot.$("aria/Get a Cat Fact!")
  //   await getCatFactBtn.click()
  //   await expect(extensionRoot.$("p")).not.toHaveText(
  //     "Click the button to fetch a fact!",
  //   )
  // })

  // if (!isFirefox) {
  //   it("should get cat facts in popup window", async () => {
  //     await browser.openExtensionPopup("My Web Extension")

  //     const extensionRoot = await $("#extension-root")
  //     const getCatFactBtn = await extensionRoot.$("aria/Get a Cat Fact!")
  //     await getCatFactBtn.click()
  //     await expect(extensionRoot.$("p")).not.toHaveText(
  //       "Click the button to fetch a fact!",
  //     )
  //   })
  // }
})
