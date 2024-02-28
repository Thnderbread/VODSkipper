import { appendFile, writeFile } from "fs/promises"
import { MutedVodSegment } from "../types"
import { browser, $, expect } from "@wdio/globals"

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

  let delaySkipCheck = 4000
  let rightBeforeSkip = 1

  /**
   * Changes:
   * when moving, rewrite the tests so that content tests don't need browser reloaded (refresh the page)
   * background scripts just go to the url respective url each time
   * popups: serverFailure & novod can be in one folder, timeout can be in another, segments can be in another.
   * ! Check the dev-test stuff, see if it matters
   * ! Spec files:
   *  ! Popup/
   *    ! ---> Failure collection
   *    ! Server failure message displayed
   *    ! No vod detected message displayed
   *    ! ---> Restart - timeout collection
   *    ! Timeout message displayed
   *    ! --> server restart - real collection
   *    ! Maybe permissions / refresh message check? (Happens when content script isn't loaded, or returns because no vod detected.)
   *    ! num muted segments / no muted segments
   *
   * ? Once that stuff is sorted:
   *  ? Organize tests, mock SW network requests
   *  ? Remove boilerplate - (index.ts files, test.tsx files)
   *  ? Fahhkiiinnnn, https cert to test req.host logging / check - check chatgpt messages
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

  // it("should show the couldn't contact server message on popup", async () => {}),

  // it("displays the popup correctly", async () => {
  //   await browser.openExtensionPopup("VodSkipper")
  //   const headerEl = await $("h1")
  //   const messageEl = await $("p")

  //   // browser.mock()

  //   const headerText = await headerEl.getText()
  //   const initialMessage = await messageEl.getText()

  //   await expect(headerText).toMatch("VODSkipper")
  //   await expect(initialMessage).toMatch("Loading...")

  //   await new Promise(resolve => setTimeout(resolve, 2000))

  //   const newMessage = await messageEl.getText()
  //   expect(newMessage).toMatch("No vod detected.")
  // })

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
