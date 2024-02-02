import browser from "webextension-polyfill"
import { fetchVodData } from "./fetchVodData"
import type {
  GetDataMessage,
  ResponseCallback,
  LocalStorageSettings,
  PopupMessage,
} from "../types"
import {
  cacheSegments,
  setInLocalStorage,
  retrieveFromLocalStorage,
  retrieveFromSessionStorage,
} from "./utils/storageHandler"

browser.runtime.onInstalled.addListener(async () => {
  const vodskipperSettings: LocalStorageSettings = {
    vodskipper: {
      enabled: true,
    },
  }
  await setInLocalStorage(vodskipperSettings)
})

async function handleContentScriptMessage(
  { action, vodID }: GetDataMessage,
  response: ResponseCallback,
): Promise<boolean | undefined> {
  if (action === "getData") {
    const existing = await retrieveFromLocalStorage("vodskipper")
    const enabled = existing?.enabled

    /**
     * If extension is disabled, just return.
     */
    if (!enabled) {
      response({ data: null, error: new Error("Extension Disabled.") })
      return true
    } else if (enabled === undefined) {
      const vodskipperSettings: LocalStorageSettings = {
        vodskipper: {
          enabled: true,
        },
      }
      await setInLocalStorage(vodskipperSettings)
    }

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
        // ! Remove this
        console.warn(`There's an error: ${error}`)
        response({ error: error.message })
        return true
      } else {
        // ! Remove this
        console.warn(
          `Error is null: ${error} and there's data: ${JSON.stringify(
            segments,
          )}`,
        )
        // Segments is never undefined here
        // since those cases store an error.
        await cacheSegments(vodID, segments!)
        response({ data: segments, error: null })
        return true
      }
    }
  }
}

async function handlePopupMessage(
  { action, data }: PopupMessage,
  response: ResponseCallback,
): Promise<void> {
  if (action === "setEnabled") {
    if (typeof data !== "boolean") {
      // not responding here so error isn't set in popup display
      console.warn("Invalid data received when changing enabled state")
      return
    }
    const vodskipperSettings: LocalStorageSettings = {
      vodskipper: {
        enabled: data,
      },
    }
    await setInLocalStorage(vodskipperSettings)
    response({ data: "Preferences updated.", error: null })
  } else if (action === "checkEnabled") {
    const existing = await retrieveFromLocalStorage("vodskipper")
    response({ data: existing.enabled, error: null })
  }
}

browser.runtime.onMessage.addListener(
  (
    msg: PopupMessage | GetDataMessage,
    sender: browser.Runtime.MessageSender,
    response: ResponseCallback,
  ) => {
    if (msg.action === "setEnabled" || msg.action === "checkEnabled") {
      void handlePopupMessage(msg, response)
      return true
    } else if (msg.action === "getData") {
      // ! Remove this
      console.log("Received content script message.")
      void handleContentScriptMessage(msg, response)
      console.log("Finished processing content script message.")
      return true
    } else {
      console.warn(`Unsupported action received: ${JSON.stringify(msg)}`)
      return true
    }
  },
)
