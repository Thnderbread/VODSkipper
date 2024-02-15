import browser from "webextension-polyfill"
import type { StatusMessageResponse } from "../../types"

async function sendStatusMessage(tab: browser.Tabs.Tab): Promise<string> {
  // Give a couple seconds for content script to complete operations
  await new Promise(resolve => setTimeout(resolve, 2000))

  if (tab && tab.id) {
    // Get information about the fetch operation -
    const response: StatusMessageResponse = await browser.tabs.sendMessage(
      tab.id,
      { action: "getStatus" },
    )
    if (Object.hasOwnProperty.call(response, "error") && response.error) {
      // TODO: Check if response.error is disabled extension, abort error, or any other specifics
      return response.error
    } else if (response.segmentLength === 0) {
      return "No muted segments for this vod."
    } else {
      return `This vod has ${response.segmentLength} muted segments.`
    }
  } else {
    return "No vod detected. VODSkipper not running."
  }
}

export default sendStatusMessage
