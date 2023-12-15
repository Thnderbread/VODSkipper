import browser from "webextension-polyfill"
import {
  LocalStorageSettings,
  retrieveFromStorage,
  setInStorage,
} from "./utils/storageHandler"
import {
  formatMutedSegmentsData,
  // getMutedVodSegmentsFromTwitch,
} from "./apiAuthProvider"
import {
  ContentScriptMessage,
  MutedVodSegment,
  ResponseCallback,
  SetEnabledMessage,
} from "../types"

let dummySegs

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
 * ? [] SessStore will have Vodskipper: { vodID: { segmentData, nearest } }
 * [✅] Return it to content_script
 *
 *
 */

browser.runtime.onInstalled.addListener(async () => {
  console.log("Omg you installed me pog")
  const segs = [
    { duration: 180, offset: 27180 },
    { duration: 180, offset: 29700 },
    { duration: 180, offset: 30240 },
    { duration: 180, offset: 30420 },
  ]

  console.log(`IN THE BG SCRIPT, LOOK AT ORIGINAL: ${segs}`)
  dummySegs = formatMutedSegmentsData(segs)

  const vodskipperSettings: LocalStorageSettings = {
    vodskipper: {
      enabled: true,
    },
  }
  await setInStorage(vodskipperSettings)
})

async function handleContentScriptMessage(
  { action, data }: ContentScriptMessage,
  response: ResponseCallback,
) {
  console.log("Received content script message")
  if (action === "getData") {
    // ! Remove this
    console.log("Received getData request. imma try to get that shit")
    const existing = await retrieveFromStorage("vodskipper")

    /**
     * If extension is disabled, just return.
     */
    if (existing?.vodskipper?.enabled === false) {
      // ! Remove this
      console.log("Welp, i'm disabled.")
      response({ data: new Error("Extension Disabled.") })
      return true
      // ? Can this ever happen? Maybe if site data is cleared or
      // ? shit's manually deleted?
    } else if (existing?.vodskipper?.enabled === undefined) {
      const vodskipperSettings: LocalStorageSettings = {
        vodskipper: {
          enabled: true,
        },
      }
      await setInStorage(vodskipperSettings)
    }

    if (typeof data !== "string") {
      // ! Remove this
      console.error(`Expected string, got ${typeof data}`)
      response({ data: new TypeError("Invalid data supplied") })
      return
    } else {
      // const [segments, error] = await getMutedVodSegmentsFromTwitch(data)

      // if (segments) {
      //   response({ data: segments })
      // } else if (segments === undefined || error === "data not found") {
      //   response({ data: [] }) // changed from undefined
      // } else if (error instanceof Error) {
      //   response({ data: error })
      // }
      // ! Remove this
      console.log(
        `Stringified the segments: ${JSON.stringify(
          dummySegs,
        )}\nParsing too: ${JSON.parse(JSON.stringify(dummySegs))}\n\n`,
      )
      console.log(`Returning the segments!: ${dummySegs}`)
      response({ data: dummySegs })
      return
    }
  } else {
    // send new time to popup
    // ! Remove this
    console.debug(`Received updateTime message from content script: ${data}`)
    await browser.runtime.sendMessage({ action: "updateTime", data })
    return
  }
}

async function handlePopupMessage(
  { action, data }: SetEnabledMessage,
  response: ResponseCallback,
) {
  if (action === "setEnabled") {
    // ! Remove this
    console.log("Hey, I'm in the bg script setting 'enabled'!")
    if (typeof data !== "boolean") {
      // ! Remove this
      console.error(`Expected bool, got ${typeof data} for ${data}`)

      response({ data: "Invalid value given." })
      return
    }
    const vodskipperSettings: LocalStorageSettings = {
      vodskipper: {
        enabled: data,
      },
    }
    await setInStorage(vodskipperSettings)
    // ! Remove this
    console.info("Preferences updated.")
    response({ data: "Preferences updated." })
    return
  }
}

// @ts-ignore
browser.runtime.onMessage.addListener(
  (
    msg: SetEnabledMessage | ContentScriptMessage,
    sender: browser.Runtime.MessageSender,
    response: ResponseCallback,
  ) => {
    // ! Remove this - set up to test no bg script response
    console.log(
      `Received a message! ${msg} | action: ${msg.action} | data: ${msg.data} `,
    )
    if (msg.action === "setEnabled") {
      handlePopupMessage(msg, response)
      return true
    } else if (msg.action === "getData") {
      console.log(`Received a getData request (message.action): ${msg.action}`)
      handleContentScriptMessage(msg, response)
      return true
    }
  },
)

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
