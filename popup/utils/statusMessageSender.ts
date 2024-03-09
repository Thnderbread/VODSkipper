import browser from "webextension-polyfill"
import type { StatusMessageResponse } from "../../types"

async function sendStatusMessage(tabId: number): Promise<string> {
  // Give a couple seconds for content script to complete operations
  let attempts = 3
  const initialDelay = 2500
  const messageDelay = 5000
  await new Promise(resolve => setTimeout(resolve, initialDelay))

  // Get information about the fetch operation
  while (attempts > 0) {
    try {
      const response: StatusMessageResponse = await browser.tabs.sendMessage(
        tabId,
        { action: "getStatus" },
      )
      if (Object.hasOwn(response, "error") && response.error !== null) {
        return response.error
      } else if (response.segmentLength === 0) {
        return "This vod has no muted segments."
      } else {
        return `This vod has ${response.segmentLength} muted segments.`
      }
    } catch (error) {
      if ((error as Error).message.includes("Receiving end does not exist.")) {
        await new Promise(resolve => setTimeout(resolve, messageDelay))
        attempts -= 1
        continue
      }
    }
  }
  /**
   * This indicates the content script could not be reached,
   * most likely because the background script did not finish
   * operations and the corresponding content script listener
   * was not created.
   */
  return "Error. Check permissions or try refreshing."
}

export default sendStatusMessage
