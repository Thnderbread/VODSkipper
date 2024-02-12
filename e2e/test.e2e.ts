import { browser, $$, $, expect } from "@wdio/globals"
import { writeFile, appendFile } from "node:fs/promises"
import { MutedVodSegment } from "../types"

const isFirefox =
  (browser.capabilities as WebdriverIO.Capabilities).browserName === "firefox"

const mutedVodID = "1409109247"
const unmutedVodID = "2050655749"

const mutedVodUrl = `https://www.twitch.tv/videos/${mutedVodID}`
const unmutedVodUrl = `https://www.twitch.tv/videos/${unmutedVodID}`

interface SkipResult {
  currentTime: number
  endingOffset: number
}

describe("VODSkipper e2e tests", () => {
  let vodPage: Window
  let segments: MutedVodSegment[] = [
    {
      startingOffset: 5783,
      endingOffset: 6143,
      duration: 360,
      readableOffset: "01:36:23",
    },
    {
      startingOffset: 14095,
      endingOffset: 14457,
      duration: 362,
      readableOffset: "03:54:55",
    },
    {
      startingOffset: 14457,
      endingOffset: 14818,
      duration: 361,
      readableOffset: "04:00:57",
    },
  ]
  let delaySkipCheck = 5500
  let rightBeforeSkip = 1

  it("displays the popup correctly", async () => {
    await browser.openExtensionPopup("VodSkipper")
    const headerEl = await $("h1")
    const messageEl = await $("p")

    const headerText = await headerEl.getText()
    const initialMessage = await messageEl.getText()

    // vodPage.focus()

    await expect(headerText).toMatch("VODSkipper")
    await expect(initialMessage).toMatch("Loading...")

    await new Promise(r => setTimeout(r, 2000))

    const newMessage = await messageEl.getText()
    expect(newMessage).toMatch("No vod detected. VODSkipper not running.")

    // await expect(initialMessage).toMatch(
    //   "No vod detected. VODSkipper not running.",
    // )
  })

  // it("Should retrieve the local vodskipper settings from local storage", async () => {}),

  // it("Shows the correct number of muted segments for the vod", async () => {})

  // it("Should persist the vod's segments in session storage after a refresh.", async () => {}),

  // it("should show the couldn't contact server message on popup", async () => {}),

  it("Should skip each detected segment in order", async () => {
    if (
      (browser.capabilities as WebdriverIO.Capabilities).browserName ===
      "firefox"
    ) {
      await browser.enableExtensionPermissions("VodSkipper")
    }

    await browser.url(mutedVodUrl)
    await new Promise(r => setTimeout(r, 5000))

    const results: SkipResult[] = await browser.executeAsync(
      async (segments, delay, beforeSkipOffset, done) => {
        const video = document.querySelector("video")
        if (video === null) throw new Error("Can't find video element.")

        const results: SkipResult[] = []

        for (const { startingOffset, endingOffset } of segments) {
          video.currentTime = startingOffset - beforeSkipOffset
          await new Promise(r => setTimeout(r, delay))
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
  // it("Should skip a segment that it's in the middle of", async () => {})
  // it("Properly skip segments it's already handled", async () => {}),
  // it("Doesn't skip ahead when the video is paused right before a segment, but skips ahead after", async () => {})
})
