import browser from "webextension-polyfill"
import { fetchVodData } from "./fetchVodData"
import type { GetDataMessage, ResponseCallback } from "../types"
import {
  cacheSegments,
  retrieveFromSessionStorage,
} from "./utils/storageHandler"

async function handleContentScriptMessage(
  { action, vodID }: GetDataMessage,
  response: ResponseCallback,
): Promise<boolean | undefined> {
  if (action === "getData") {
    if (typeof vodID !== "string") {
      response({ error: new TypeError("Invalid data received") })
      return true
    } else {
      const cached = await retrieveFromSessionStorage("vodskipper")

      if (cached && cached[vodID]) {
        response({ data: cached[vodID], error: null })
        return true
      }

      const [error, segments] = await fetchVodData(vodID)

      if (error !== null) {
        response({ error: error.message })
        return true
      } else {
        // Segments is never undefined here
        // since those cases store an error.
        await cacheSegments(vodID, segments!)
        response({ data: segments, error: null })
        return true
      }
    }
  }
}

browser.runtime.onMessage.addListener(
  (
    msg: GetDataMessage,
    sender: browser.Runtime.MessageSender,
    response: ResponseCallback,
  ) => {
    if (msg.action === "getData") {
      void handleContentScriptMessage(msg, response)
      return true
    } else {
      console.warn(`Unsupported action received: ${JSON.stringify(msg)}`)
      return true
    }
  },
)
