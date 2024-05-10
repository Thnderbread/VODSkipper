import browser from "webextension-polyfill"
import { fetchVodData } from "./fetchVodData"
import type { GetDataMessage, ResponseCallback } from "../types"
import { isValidVod } from "../content-script/utils/utils"

async function handleContentScriptMessage(
  { vodUrl }: GetDataMessage,
  response: ResponseCallback,
): Promise<boolean | undefined> {
  const vodID = isValidVod(vodUrl)
  if (vodID === false) {
    console.warn("Invalid data received.")
    response({ data: undefined })
    return true
  } else {
    const { success, data } = await fetchVodData(vodID)

    if (!success) {
      response({ data: undefined })
      return true
    } else {
      response({ data })
      return true
    }
  }
}

browser.runtime.onMessage.addListener(
  (msg: GetDataMessage, _, response: ResponseCallback) => {
    if (msg.action === "getData") {
      void handleContentScriptMessage(msg, response)
      return true
    } else {
      console.warn(`Unsupported action received: ${JSON.stringify(msg)}`)
      return true
    }
  },
)
