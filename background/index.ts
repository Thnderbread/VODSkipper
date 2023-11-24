import browser from "webextension-polyfill"
import { retrieveFromStorage } from "./utils/storageHandler"
import { getMutedVodSegmentsFromTwitch } from "./apiAuthProvider"

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
     *
     * TODO: "existing" should be typed as having vodskipper prop.
     * TODO: vodskipper should be typed as having enabled (bool) prop. Maybe other settings as well (vod skip data)
     */
    if (existing?.vodskipper?.enabled === false) {
      response({ data: null })
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
  }
}

type Message = {
  action: "getData" | "update" | "setEnabled"
  data: string
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

// @ts-ignore
browser.runtime.onMessage.addListener((msg, sender, response) => {
  handleMessage(msg, response)
  return true
})
