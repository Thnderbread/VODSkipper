/* eslint-disable @typescript-eslint/restrict-template-expressions */
import browser from "webextension-polyfill"
import { fetchVodData } from "./apiAuthProvider"
import {
  cacheSegments,
  setInLocalStorage,
  retrieveFromLocalStorage,
  retrieveFromSessionStorage,
} from "./utils/storageHandler"
import type {
  GetDataMessage,
  ResponseCallback,
  SetEnabledMessage,
  LocalStorageSettings,
} from "../types"

// ! Added a listener in the popup so it knows when no data is found
// ! More testing and cleanup, write tests
// ! Maybe just have this shit use my tokens for shit?
// ! gonna have to pause for maintenance every once in a while to replace the token though

// let dummySegs

/**
 * Properly set up content script to receive bg script data.
 * Process data in content script (response == string? arr? undefined?)
 * Display output accordingly.
 * Store data? nah.
 * Make sure skips are working.
 *
 * Just hit up api for the bs and shit, cache the vod data
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
  // const segs = [
  //   { duration: 180, offset: 27180 },
  //   { duration: 180, offset: 29700 },
  //   { duration: 180, offset: 30240 },
  //   { duration: 180, offset: 30420 },
  // ]

  // console.log(`IN THE BG SCRIPT, LOOK AT ORIGINAL: ${segs}`)
  // dummySegs = formatMutedSegmentsData(segs)

  const vodskipperSettings: LocalStorageSettings = {
    vodskipper: {
      enabled: true,
    },
  }
  console.log("setting things in storage...")
  await setInLocalStorage(vodskipperSettings)
  console.log(
    `set things in storage: ${JSON.stringify(
      await retrieveFromLocalStorage("vodskipper"),
    )}`,
  )
})

async function handleContentScriptMessage(
  { action, data }: GetDataMessage,
  response: ResponseCallback,
): Promise<boolean | undefined> {
  console.log("Received content script message")
  if (action === "getData") {
    // ! Remove this
    console.log("Received getData request. Imma try to get that shit")
    const existing = await retrieveFromLocalStorage("vodskipper")
    const enabled = existing?.enabled

    /**
     * If extension is disabled, just return.
     */
    if (!enabled) {
      // ! Remove this
      console.log("Welp, I'm disabled.")
      response({ data: null, error: new Error("Extension Disabled.") })
      return undefined
      // ? Can this ever happen? Maybe if site data is cleared or
      // ? it's manually deleted?
    } else if (enabled === undefined) {
      const vodskipperSettings: LocalStorageSettings = {
        vodskipper: {
          enabled: true,
        },
      }
      await setInLocalStorage(vodskipperSettings)
    }

    if (typeof data !== "string") {
      // ! Remove this
      console.error(`Expected string, got ${typeof data}`)
      response({ error: new TypeError("Invalid data received") })
      return undefined
    } else {
      const cachedSegments = await retrieveFromSessionStorage("vodskipper")
      try {
        if (cachedSegments[data]?.length === 0) {
          response({ data: [], error: null })
          return undefined
        } else if (cachedSegments[data].length > 0) {
          response({ data: cachedSegments[data], error: null })
          return undefined
        }
      } catch (error) {
        if (error instanceof TypeError) {
          console.error(
            "No segments found in session store. Fetching from server",
          )
        }
      }

      const [error, segments] = await fetchVodData(data)
      await cacheSegments(data, segments ?? [])

      if (error !== null) {
        // TODO: Revise error checking - understand what is returned from api when errors happen
        if (error.message === "data not found") {
          console.log(`Error occurred in bg: ${error}`)
          response({ error })
          return true
        }
      } else if (segments !== undefined) {
        // TODO: Because data isn't returned explicitly - sum bout arrow fns?
        console.log(`The segments in bg: ${JSON.stringify(segments)}`)
        response({ data: segments, error: null })
        return true
      } else {
        console.log("In bg, no data found")
        // let popup know that no data was found
        await browser.runtime.sendMessage({ action: "getData", data: [] })
        response({ data: [], error: null })
        return true
      }
    }
  }
}

async function handlePopupMessage(
  { action, data }: SetEnabledMessage,
  response: ResponseCallback,
): Promise<void> {
  if (action === "setEnabled") {
    // ! Remove this
    console.log("Hey, I'm in the bg script setting 'enabled'!")
    if (typeof data !== "boolean") {
      // ! Remove this
      console.error(`Expected bool, got ${typeof data} for ${data}`)

      response({ error: new TypeError("Invalid data received") })
      return undefined
    }
    const vodskipperSettings: LocalStorageSettings = {
      vodskipper: {
        enabled: data,
      },
    }
    await setInLocalStorage(vodskipperSettings)
    // ! Remove this
    console.info("Preferences updated.")
    response({ data: "Preferences updated.", error: null })
  } else if (action === "check") {
    console.log("In bg joint, checking enabled status")
    const existing = await retrieveFromLocalStorage("vodskipper")
    console.log(`Existing: ${JSON.stringify(existing)}`)
    // const enabled = existing?.vodskipper?.enabled
    response({ data: existing.enabled, error: null })
  }
}

browser.runtime.onMessage.addListener(
  (
    msg: SetEnabledMessage | GetDataMessage,
    sender: browser.Runtime.MessageSender,
    response: ResponseCallback,
  ) => {
    // ! Remove this - set up to test no bg script response
    console.log(
      `Received a message! ${JSON.stringify(msg)} | action: ${
        msg.action
      } | data: ${msg.data} `,
    )
    // @ts-expect-error testing sumn
    if (msg.action === "setEnabled" || msg.action === "check") {
      void handlePopupMessage(msg, response)
      return true
    } else if (msg.action === "getData") {
      console.log(`Received a getData request (message.action): ${msg.action}`)
      void handleContentScriptMessage(msg, response)
      return true
    } else {
      console.warn(`Unsupported action received: ${JSON.stringify(msg)}`)
      response({ error: new Error("Unsupported action.") })
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
