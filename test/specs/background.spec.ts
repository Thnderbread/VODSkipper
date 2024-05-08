import { browser, $, expect } from "@wdio/globals"
import * as fixtures from "../fixtures/vodStuff.js"
import { CacheObject, CacheObjectLiteral } from "../../types"

describe("VODSkipper background tests", () => {
  before(async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    } else if (browserName === "chrome") {
      // test trips out if google is not hit first
      await browser.url("https://google.com")
    }
  })

  it("Background - Should cache the vod responses properly", async () => {
    await browser.url(fixtures.mutedVodUrl)
    await browser.newWindow(fixtures.unmutedVodUrl)

    // wait for the video to load,
    // so that background page can finish operations
    const video = await $("video")
    await video.waitForExist({
      timeout: 5000,
      interval: 1000,
      timeoutMsg: "Can't find video element.",
    })

    await browser.newWindow("")
    await browser.openExtensionPopup("VodSkipper")

    const messageEl = await $("p")
    await messageEl.waitForExist({ timeout: 5000 })
    await browser.waitUntil(
      async () => {
        return (await messageEl.getText()) !== "Loading"
      },
      {
        timeout: 10000,
        timeoutMsg: 'Popup message still says "Loading...".',
      },
    )

    const cached: Record<string, CacheObjectLiteral> =
      await browser.executeAsync(
        async (mutedVodID, unmutedVodID, done) => {
          // get an error when using webextension polyfill,
          // fortunately the chrome namespace works for both browsers here
          const mutedSegmentsObj: CacheObject =
            await chrome.storage.session.get(mutedVodID)
          const unmutedSegmentsObj: CacheObject =
            await chrome.storage.session.get(unmutedVodID)

          const mutedSegments = mutedSegmentsObj[mutedVodID]
          const unmutedSegments = unmutedSegmentsObj[unmutedVodID]
          // ! Remove this
          console.log(
            `Muted: ${JSON.stringify(
              mutedSegments,
            )}\n\nUnmuted: ${JSON.stringify(unmutedSegments)}`,
          )
          done({ mutedSegments, unmutedSegments })
        },
        fixtures.mutedVodID,
        fixtures.unmutedVodID,
      )

    expect(cached.mutedSegments).toMatchObject(fixtures.MUTED_SEGMENT_DATA)
    expect(cached.unmutedSegments).toMatchObject(fixtures.UNMUTED_SEGMENT_DATA)
  })
})
