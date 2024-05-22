import wait from "../helpers/wait.js"
import { browser, $, expect } from "@wdio/globals"
import * as fixtures from "../fixtures/vodStuff.js"
import loadingMessage from "../helpers/loadingMessage.js"
import { CacheObject, CacheObjectLiteral } from "../../types"

describe("VODSkipper background tests", () => {
  let browserName = (browser.capabilities as WebdriverIO.Capabilities)
    .browserName
  /**Amount of time to wait for popup's 'loading...' message to change */
  const loadingDelay = 15000
  /**Amount of time to wait for element to exist */
  const elemExistDelay = 5000

  before(async () => {
    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    } else if (browserName === "chrome") {
      // test trips out if google is not hit first
      await browser.url("https://google.com")
    }
  })

  it("segments - Should cache the vod responses properly", async () => {
    await browser.url(fixtures.mutedVodUrl)
    await browser.newWindow(fixtures.unmutedVodUrl)

    // wait for the video to load,
    // so that background page can finish operations
    const video = await $("video")
    await video.waitForExist({
      timeout: elemExistDelay,
      interval: 1000,
      timeoutMsg: "Can't find video element.",
    })

    await browser.newWindow("")
    await browser.openExtensionPopup("VodSkipper")

    const messageEl = await $("p")
    await messageEl.waitForExist({ timeout: elemExistDelay })
    await browser.waitUntil(
      async () => {
        return (await messageEl.getText()) !== "Loading"
      },
      {
        timeout: loadingDelay,
        timeoutMsg: loadingMessage(browserName as string, loadingDelay),
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

          done({ mutedSegments, unmutedSegments })
        },
        fixtures.mutedVodID,
        fixtures.unmutedVodID,
      )
    expect(cached.mutedSegments).toMatchObject(fixtures.MUTED_SEGMENT_DATA)
    expect(cached.unmutedSegments).toMatchObject(fixtures.UNMUTED_SEGMENT_DATA)
  })
})
