import handleAd from "../helpers/handleAd.js"
import { browser, $, expect } from "@wdio/globals"
import { SEGMENTS, mutedVodUrl } from "../fixtures/vodStuff.js"

interface SkipResult {
  currentTime: number
  endingOffset: number
}

let delaySkipCheck = 4000
let rightBeforeSkip = 1

// TODO: Figure out better polling than setTimeout + promise
describe("VODSkipper content script tests", () => {
  before(async () => {
    const browserName = (browser.capabilities as WebdriverIO.Capabilities)
      .browserName

    if (browserName === "firefox") {
      await browser.enableExtensionPermissions("VodSkipper")
    } else if (browserName === "chrome") {
      // test trips out if google is not hit first
      await browser.url("https://google.com")
    }
    await browser.url(mutedVodUrl)
  })

  beforeEach(async () => {
    await handleAd()
    /**
     * lower quality to try and improve
     * performance. Wait until after the
     * ad is handled
     *
     * Also, lowering quality after the ad finishes
     * because idk if the settings button is available
     * during ad playback
     */
    await browser.lowerVideoQuality()
    // Wait a couple seconds
    await new Promise(r => setTimeout(r, 1500))
  })

  afterEach(async () => {
    await browser.refresh()
  })

  it("Should skip each detected segment in order", async () => {
    const results: SkipResult[] = await browser.executeAsync(
      async (segments, delay, beforeSkipOffset, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        const results: SkipResult[] = []

        for (const { startingOffset, endingOffset } of segments) {
          video.currentTime = startingOffset - beforeSkipOffset
          await new Promise(resolve => setTimeout(resolve, delay))
          results.push({ currentTime: video.currentTime, endingOffset })
        }
        done(results)
      },
      SEGMENTS,
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

  it("Should properly skip a segment preceding one it's just skipped", async () => {
    const [precedingSegment, laterSegment] = SEGMENTS

    const results: SkipResult[][] = await browser.executeAsync(
      async (preceding, later, delay, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        // Using the regular offset causes things to move too
        // fast and yield inaccurate results, so using a bigger offset
        const biggerSkipOffset = 2
        const initialSkipResults: SkipResult[] = []
        const rewoundSkipResults: SkipResult[] = []

        video.currentTime = later.startingOffset - biggerSkipOffset
        // TODO: Figure out better polling solution
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

  it("Should skip past a segment it's in the middle of", async () => {
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
      SEGMENTS,
      delaySkipCheck,
    )
    // A js error can occur and the test can return an empty array,
    // satisfying the forEach check.
    expect(results.length).toBeGreaterThanOrEqual(1)
    results.forEach(result =>
      expect(result.currentTime).toBeGreaterThanOrEqual(result.endingOffset),
    )
  })

  it("Shouldn't skip ahead when the video is paused right before a segment", async () => {
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
      SEGMENTS,
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
