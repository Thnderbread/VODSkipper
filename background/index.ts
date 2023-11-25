import browser from "webextension-polyfill"
import {
  LocalStorageSettings,
  retrieveFromStorage,
  setInStorage,
} from "./utils/storageHandler"
import { getMutedVodSegmentsFromTwitch } from "./apiAuthProvider"
import { MutedVodSegment } from "../types"

/**
 * Properly set up content script to receive bg script data.
 * Process data in content script (response == string? arr? undefined?)
 * Display output accordingly.
 * Store data? nah.
 * Make sure skips are working.
 */

/**
 * [✅] Get data via Twurple.
 * [✅] Format data (add offset stuff)
 * ? [⚠️] Store it in session storage or cookie - want data persisted through refreshes - store and retrieve enabled setting as of now.
 * [✅] Return it to content_script
 */

async function handleMessage(
  { action, data }: Message,
  response: ResponseCallback,
) {
  if (action === "getData") {
    const existing = await retrieveFromStorage("vodskipper")

    /**
     * If extension is disabled, just return.
     */
    if (existing?.vodskipper?.enabled === false) {
      response({ data: null })
      return
      // ? Can this ever happen? Maybe if site data is cleared or
      // ? shit's manually deleted?
    } else if (existing?.vodskipper.enabled === undefined) {
      const vodskipperSettings: LocalStorageSettings = {
        vodskipper: {
          enabled: true,
        },
      }
      await setInStorage(vodskipperSettings)
    }

    if (typeof data !== "string") {
      response({ data: "Invalid value supplied" })
      return
    }

    const [segments, error] = await getMutedVodSegmentsFromTwitch(data)

    if (segments) {
      response({ data: segments })
    } else if (segments === undefined || error === "data not found") {
      response({ data: undefined })
    } else if (error instanceof Error) {
      response({ data: error })
    }
  } else if (action === "setEnabled") {
    if (typeof data !== "boolean") {
      response({ data: "Invalid value given." })
      return
    }
    const vodskipperSettings: LocalStorageSettings = {
      vodskipper: {
        enabled: data,
      },
    }
    await setInStorage(vodskipperSettings)
    response({ data: "Preferences updated." })
    return
  }
}

export interface BackgroundScriptResponse {
  data: MutedVodSegment[] | undefined | Error
}

// @ts-ignore
browser.runtime.onMessage.addListener((msg, sender, response) => {
  handleMessage(msg, response)
  return true
})

type Message = {
  action: "getData" | "updateTime" | "setEnabled"
  // string represents vodId, boolean represents enabled status, number represents update time
  data: string | boolean
}

type ResponseCallback = <T>(data: T) => void

// type Message = {
//   action: "fetch"
//   value: null
// }

// type ResponseCallback = <T>(data: T) => void

// async function handleMessage(
//   { action, value }: Message,
//   response: ResponseCallback,
// ) {
//   if (action === "fetch") {
//     // debugger
//     const result = await fetch("https://meowfacts.herokuapp.com/")

//     const { data } = await result.json()

//     response({ message: "success", data })
//   } else {
//     response({ data: null, error: "Unknown action" })
//   }
// }
