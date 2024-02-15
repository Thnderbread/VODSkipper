import { browser, $$, $, expect } from "@wdio/globals"
import { writeFile, appendFile } from "node:fs/promises"
import { MutedVodSegment } from "../types"

const isFirefox =
  (browser.capabilities as WebdriverIO.Capabilities).browserName === "firefox"

const mutedVodID = "1780240732"
const unmutedVodID = "2050655749"

const mutedVodUrl = `https://www.twitch.tv/videos/${mutedVodID}`
const unmutedVodUrl = `https://www.twitch.tv/videos/${unmutedVodID}`

function wait(delay: number) {
  return new Promise(resolve => setTimeout(resolve, delay))
}
interface SkipResult {
  currentTime: number
  endingOffset: number
}

describe("VODSkipper e2e tests", () => {
  let segments: MutedVodSegment[] = [
    {
      startingOffset: 2520,
      endingOffset: 2700,
      duration: 180,
      readableOffset: "42:00.",
    },
    {
      startingOffset: 2880,
      endingOffset: 3060,
      duration: 180,
      readableOffset: "48:00.",
    },
    {
      startingOffset: 4680,
      endingOffset: 4860,
      duration: 180,
      readableOffset: "01:18:00",
    },
  ]

  let delaySkipCheck = 5500
  let rightBeforeSkip = 1

  /**
   * Changes:
   * ? Once that stuff is sorted:
   *  ? Fix service worker (caches instead of session storage)
   *  ? Remove boilerplate
   *  ? Maaaayyybeee refactoring message thingy? (Classes)
   *
   */

  // An actual good developer would put the enableExtensionPerms in a
  // beforeEach hook, but that breaks because something tries to access
  // a reference outside of the browsing context. Idk if it's the one in
  // the hook or if it's because there wouldn't be one in the test but I
  // can't be asked to figure it out honestly

  afterEach(async () => {
    await browser.reloadSession()
  })

  // it("Should retrieve the local vodskipper settings from local storage", async () => {}),

  // it("should show the couldn't contact server message on popup", async () => {}),

  // it("Should persist the vod's segments in session storage after a refresh.", async () => {}),

  it("displays the popup correctly", async () => {
    await browser.openExtensionPopup("VodSkipper")
    const headerEl = await $("h1")
    const messageEl = await $("p")

    const headerText = await headerEl.getText()
    const initialMessage = await messageEl.getText()

    await expect(headerText).toMatch("VODSkipper")
    await expect(initialMessage).toMatch("Loading...")

    await new Promise(resolve => setTimeout(resolve, 2000))

    const newMessage = await messageEl.getText()
    expect(newMessage).toMatch("No vod detected. VODSkipper not running.")
  })

  it("Shows the correct number of muted segments for the vod", async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
      await browser.url(mutedVodUrl)

      const extWindowHandle = await browser.newWindow("")
      await browser.openExtensionPopup("VodSkipper")
      await browser.switchToWindow(extWindowHandle)
    } else if (browserName === "chrome") {
      await browser.openExtensionPopup("VodSkipper")
      const extWindow = await browser.getWindowHandle()

      /**
       * If the vod page isn't focused when the popup is loaded,
       * the popup won't be able to properly access the content script
       * running on the vod page, and will thus
       * display the "No vod detected" message.
       */
      await browser.execute(vodUrl => {
        const extPage = window
        const vodWindow = window.open(vodUrl, "_blank")

        vodWindow?.focus()
        setTimeout(() => {
          extPage.location.reload()
        }, 3000)
      }, mutedVodUrl)

      await wait(5000)

      // at this point, switch back to ext page and evaluate
      await browser.switchToWindow(extWindow)
    }
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
        timeoutMsg: `[${browserName} browser]: Text isn't different after 10s`,
      },
    )

    const headerText = await headerEl.getText()
    const message = await messageEl.getText()

    await expect(headerText).toMatch("VODSkipper")
    await expect(message).toMatch(
      `This vod has ${segments.length} muted segments.`,
    )
  })

  it("Should skip each detected segment in order", async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    }

    await browser.url(mutedVodUrl)
    await handleAd()

    const results: SkipResult[] = await browser.executeAsync(
      async (segments, delay, beforeSkipOffset, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        const results: SkipResult[] = []

        for (const { startingOffset, endingOffset } of segments) {
          video.currentTime = startingOffset - beforeSkipOffset
          // TODO: Figure out better polling solution
          await new Promise(resolve => setTimeout(resolve, delay))
          results.push({ currentTime: video.currentTime, endingOffset })
        }
        done(results)
      },
      segments,
      delaySkipCheck,
      rightBeforeSkip,
    )
    // A js error can occur and the test can return an empty array,
    // satisfying the forEach check.
    expect(results.length).toBeGreaterThanOrEqual(1)
    results.forEach(result =>
      expect(result.currentTime).toBeGreaterThanOrEqual(result.endingOffset),
    )
  })

  it("Should skip a segment that it's in the middle of", async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    }

    await browser.url(mutedVodUrl)
    await handleAd()

    const results: SkipResult[] = await browser.executeAsync(
      async (segments, delay, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        const results: SkipResult[] = []
        const { startingOffset, endingOffset } = segments[0]

        video.currentTime = (startingOffset + endingOffset) / 2
        // TODO: Figure out better polling solution
        await new Promise(resolve => setTimeout(resolve, delay))
        results.push({ currentTime: video.currentTime, endingOffset })

        done(results)
      },
      segments,
      delaySkipCheck,
    )
    // A js error can occur and the test can return an empty array,
    // satisfying the forEach check.
    expect(results.length).toBeGreaterThanOrEqual(1)
    results.forEach(result =>
      expect(result.currentTime).toBeGreaterThanOrEqual(result.endingOffset),
    )
  })

  /**
   * Making sure that the content script
   * can properly handle seek events
   * and setting the proper nearest segment
   * no matter where it's at in the vod
   * or what it's done prior
   * */
  it("Properly skips a segment preceding one it's just skipped", async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    }

    await browser.url(mutedVodUrl)
    await handleAd()

    const [precedingSegment, laterSegment] = segments

    const results: SkipResult[][] = await browser.executeAsync(
      async (preceding, later, delay, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        // Using the regular offset causes things to move too
        // fast and yield inaccurate results, so using a bigger offset
        // TODO: Try and figure out a better polling solution
        const biggerSkipOffset = 2
        const initialSkipResults: SkipResult[] = []
        const rewoundSkipResults: SkipResult[] = []

        video.currentTime = later.startingOffset - biggerSkipOffset
        await new Promise(resolve => setTimeout(resolve, delay))
        initialSkipResults.push({
          currentTime: video.currentTime,
          endingOffset: later.endingOffset,
        })

        // Wait for skip to finish and add to results
        await new Promise(resolve => setTimeout(resolve, 2500))

        video.currentTime = preceding.startingOffset - biggerSkipOffset
        await new Promise(resolve => setTimeout(resolve, delay))
        rewoundSkipResults.push({
          currentTime: video.currentTime,
          endingOffset: preceding.endingOffset,
        })
        done([initialSkipResults, rewoundSkipResults])
      },
      precedingSegment,
      laterSegment,
      delaySkipCheck,
    )
    // A js error can occur and the test can return an empty array,
    // satisfying the forEach check.
    const [initial, rewound] = results

    expect(initial.length).toBeGreaterThanOrEqual(1)
    expect(rewound.length).toBeGreaterThanOrEqual(1)

    initial.forEach(result =>
      expect(result.currentTime).toBeGreaterThanOrEqual(result.endingOffset),
    )
    rewound.forEach(result =>
      expect(result.currentTime).toBeGreaterThanOrEqual(result.endingOffset),
    )
  })

  it("Doesn't skip ahead when the video is paused right before a segment, but skips ahead after", async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    }

    await browser.url(mutedVodUrl)
    await handleAd()

    const results: SkipResult[][] = await browser.executeAsync(
      async (segments, delay, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        /** Give a little more time than normal before the skip should happen */
        const beforeSkipOffset = 2
        const pauseDelay = 2000
        const playTester: SkipResult[] = []
        const pauseTester: SkipResult[] = []
        const { startingOffset, endingOffset } = segments[0]

        video.currentTime = startingOffset - beforeSkipOffset
        video.pause()
        // TODO: Figure out better polling solution
        await new Promise(resolve => setTimeout(resolve, pauseDelay))
        pauseTester.push({ currentTime: video.currentTime, endingOffset })

        video.play()
        // TODO: Figure out better polling solution
        await new Promise(resolve => setTimeout(resolve, delay))
        playTester.push({ currentTime: video.currentTime, endingOffset })
        done([pauseTester, playTester])
      },
      segments,
      delaySkipCheck,
    )

    const [pauseResults, playResults] = results
    expect(playResults.length).toBeGreaterThanOrEqual(1)
    expect(pauseResults.length).toBeGreaterThanOrEqual(1)

    pauseResults.forEach(result =>
      expect(result.currentTime).toBeLessThan(result.endingOffset),
    )
    playResults.forEach(result =>
      expect(result.currentTime).toBeGreaterThanOrEqual(result.endingOffset),
    )
  })
})

/**
 * Looks for an ad label on the page. If it finds one,
 * it waits 40 seconds for it to go away,
 * signaling the end of the ad. Silently returns if
 * there is no ad found.
 */
async function handleAd() {
  const ad = await $("[aria-label=Ad]")
  try {
    // Check for ad while page is loading
    await ad.waitForExist({
      timeout: 10000,
      interval: 1000,
      timeoutMsg: "No ad.",
    })
    // If it's found, give some time for it to finish
    await ad.waitForExist({
      reverse: true,
      timeout: 40000,
      interval: 2000,
      timeoutMsg: "Ad too long.",
    })
  } catch (error) {
    // only throwing if the ad is too long,
    // or some other error occurs.
    if (error.message !== "No ad.") {
      throw error
    }
  }
}
