import browser from "webextension-polyfill"
import type { StatusMessageResponse } from "../../types"

async function sendStatusMessage(tab: browser.Tabs.Tab): Promise<string> {
  // Give a couple seconds for content script to complete operations
  await new Promise(resolve => setTimeout(resolve, 2000))

  if (tab && tab.id) {
    // ! Remove this
    console.log("Have the tab & id. Tryna get info.")
    // Get information about the fetch operation -
    const response: StatusMessageResponse = await browser.tabs.sendMessage(
      tab.id,
      { action: "getStatus" },
    )
    if (Object.hasOwnProperty.call(response, "error") && response.error) {
      // ! Remove this
      console.log(
        `Got a response, but there's an error: ${JSON.stringify(
          response.error,
        )}`,
      )
      // TODO: Check if response.error is disabled extension, abort error, or any other specifics
      return response.error
    } else if (response.segmentLength === 0) {
      // ! Remove this
      console.log("Got a response, no muted segments.")
      return "No muted segments for this vod."
    } else {
      // ! Remove this
      console.log("Got a response, everything is fine.")
      return `This vod has ${response.segmentLength} muted segments.`
    }
  } else {
    // ! Remove this
    console.warn(`No tab ${tab} or tab id: ${tab?.id}`)
    return "No vod detected. VODSkipper not running."
  }
}

export default sendStatusMessage
