import browser from "webextension-polyfill"
import type { StatusMessageResponse } from "../../types"

async function sendStatusMessage(tabId: number): Promise<string> {
  // Give a couple seconds for content script to complete operations
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Get information about the fetch operation
  try {
    const response: StatusMessageResponse = await browser.tabs.sendMessage(
      tabId,
      { action: "getStatus" },
    )
    if (Object.hasOwnProperty.call(response, "error") && response.error) {
      return response.error
    } else if (response.segmentLength === 0) {
      return "No muted segments for this vod."
    } else {
      return `This vod has ${response.segmentLength} muted segments.`
    }
  } catch (error) {
    console.error(error)
    return "Error. Check permissions or try refreshing."
  }
}

export default sendStatusMessage
