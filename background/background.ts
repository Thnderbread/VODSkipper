/* eslint-disable @typescript-eslint/restrict-template-expressions */
import browser from "webextension-polyfill"
import { fetchVodData } from "./fetchVodData"
import {
  cacheSegments,
  setInLocalStorage,
  retrieveFromLocalStorage,
  retrieveFromSessionStorage,
} from "./utils/storageHandler"
import type {
  GetDataMessage,
  ResponseCallback,
  LocalStorageSettings,
  PopupMessage,
} from "../types"

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
      return undefined
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
      return undefined
    } else {
      const cachedSegments = await retrieveFromSessionStorage("vodskipper")
      try {
        if (cachedSegments[vodID]?.length === 0) {
          response({ data: [], error: null })
          return undefined
        } else if (cachedSegments[vodID].length > 0) {
          response({ data: cachedSegments[vodID], error: null })
          return undefined
        }
      } catch (error) {
        if (error instanceof TypeError) {
          console.error(
            "No segments found in session store. Fetching from server",
          )
        }
      }

      const [error, segments] = await fetchVodData(vodID)
      await cacheSegments(vodID, segments ?? [])

      if (error !== null) {
        if (error.message === "Something went wrong.") {
          response({ error })
          return true
        } else if (error.message === "Request timed out.") {
          response({ error })
          return true
        }
      } else if (segments !== undefined) {
        response({ data: segments, error: null })
        return true
      } else {
        // let popup know that no data was found
        await browser.runtime.sendMessage({ action: "getData", data: [] })
        response({ data: [], error: null })
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
      response({ error: new TypeError("Invalid data received") })
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
      void handleContentScriptMessage(msg, response)
      return true
    } else {
      console.warn(`Unsupported action received: ${JSON.stringify(msg)}`)
      response({ error: new Error("Unsupported action.") })
      return true
    }
  },
)
