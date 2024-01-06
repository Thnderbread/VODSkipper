/* eslint-disable @typescript-eslint/restrict-template-expressions */
import reducer from "./reducer"
import browser from "webextension-polyfill"
import DEFAULTSEGMENT from "../common/DefaultSegment"
import type React from "react"
import { useState, useEffect, useReducer, useRef } from "react"

import {
  createListener,
  shouldCreateListener,
  findNearestMutedSegment,
} from "../functions"
import {
  type State,
  // type PopupMessage,
  type GetDataResponse,
  // type ResponseCallback,
  // DecisionCodes,
} from "../types"

const initialState: State = {
  error: "",
  enabled: true,
  mutedSegments: [],
  nearestSegment: DEFAULTSEGMENT,
}

const ContentScript: React.FC = () => {
  // TODO: Instead of this, use a failed to load variable for when the timer (that will be implemented) for data fetching
  // const [attempts, setAttempts] = useState(2)
  const [loaded, setLoaded] = useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)
  const listener = useRef<NodeJS.Timeout | undefined>(undefined)

  const vodID = document.location.pathname.split("/")[2]
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const video = document.querySelector("video")!

  // using this format to take advantage of removeEventListener
  const seekedHandler = (): void => {
    // ! Remove this
    console.log("Seek detected!")
    if (state.mutedSegments.length > 0) {
      clearTimeout(listener.current)

      const nearest = findNearestMutedSegment(video, state.mutedSegments)
      // ! Remove this
      console.log(`New nearest segment: ${JSON.stringify(nearest)}`)
      dispatch({ type: "SET_NEAREST", payload: nearest })
    } else {
      // ! Remove this
      console.log("Not handling the seek, but here's some juice: 🧃")
    }
  }

  const playingHandler = (): void => {
    // ! Remove this
    console.log("Video playing")
    if (shouldCreateListener(state.nearestSegment, state.mutedSegments) === 0) {
      console.log("Creating a listener.")
      listener.current = createListener(
        state.nearestSegment.startingOffset,
        state.nearestSegment.endingOffset,
        video,
      )
    }
    // ! Remove this
    console.log("No listener created, but here's a pizza: 🍕")
  }

  const pauseHandler = (): void => {
    // ! Remove this
    console.log("Video paused - clearing listeners")
    clearTimeout(listener.current)
    listener.current = undefined
  }

  const setupListeners = (): void => {
    video.addEventListener("playing", playingHandler)
    video.addEventListener("seeked", seekedHandler)
    video.addEventListener("pause", pauseHandler)
  }

  const tearDownListeners = (): void => {
    video.removeEventListener("playing", playingHandler)
    video.removeEventListener("seeked", seekedHandler)
    video.removeEventListener("pause", pauseHandler)

    clearTimeout(listener.current)
    listener.current = undefined
  }

  // On mount useEffect
  useEffect(() => {
    void (async () => {
      console.log("Starting bg script fetching")
      const { data, error }: GetDataResponse =
        await browser.runtime.sendMessage({
          action: "getData",
          data: vodID,
        })
      // ! Remove this
      console.log(`Received a response from bg!: ${data}`)
      if (error !== null) {
        // ! Remove this
        console.error(`Got an error! ${data}`)
        dispatch({ type: "SET_ERROR", payload: error.message })
        setLoaded(true)
      } else if (data.length === 0) {
        // Returning if there's no data
        // since initial reducer state has dummy data
        // ! Remove this
        console.log(`Muted segments not found for vod ${vodID}.`)
        setLoaded(true)
      } else {
        // ! Remove this
        console.log(`Found ${data.length} muted segments for vod ${vodID}.`)
        dispatch({ type: "SET_MUTED_SEGMENTS", payload: data })
        dispatch({
          type: "SET_NEAREST",
          payload: findNearestMutedSegment(video, data),
        })
        setLoaded(true)
      }
    })()

    console.log("The content script is le loaded!")

    // Own function
    // const popupListener = (
    //   { action, data }: PopupMessage,
    //   sender: browser.Runtime.MessageSender,
    //   response: ResponseCallback,
    // ): void => {
    //   // from fetching bg script data.
    //   if (state.error !== "") {
    //     response({ data: null, error: state.error })
    //     return
    //     // TODO: Maybe a obj with actions and associated
    //     // TODO: data types and check that way
    //   } else if (action !== "setEnabled") {
    //     response({ error: new TypeError("Unsupported action.") })
    //     return
    //   } else if (typeof data !== "boolean") {
    //     response({ error: new TypeError("Invalid data received") })
    //     return
    //   }

    //   // was trying to check why listeners are still being made
    //   // most recent change looks like content script is no longer
    //   // getting messages, try ctrl z until things work again
    //   if (data) {
    //     console.log(`The data value is true: ${data} creating a listener maybe`)
    //     const decision = shouldCreateListener(
    //       state.nearestSegment,
    //       state.mutedSegments,
    //     )
    //     if (decision === DecisionCodes.NoMutedSegments) {
    //       response({ data: "No muted segments found for this vod." })
    //     } else if (decision === DecisionCodes.NearestIsDefault) {
    //       response({ data: "No muted segments ahead." })
    //     } else {
    //       tearDownListeners()
    //       setupListeners()
    //       response({ data: "Listener created." })
    //     }
    //   } else {
    //     // If the user disabled the extension,
    //     // cancel any active listeners
    //     // ! Remove this
    //     console.log(
    //       `Received a setEnabled message: ${action} with data: ${data}`,
    //     )
    //     // ! Remove this
    //     // ? Set some variable to make sure no new listeners are made?
    //     console.log(`Cleared all listeners due to ${action} message.`)
    //     response({ data: "Listeners cleared." })
    //   }
    // }

    const handleStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
    ): void => {
      if (changes.vodskipper !== undefined) {
        // ! Remove this
        console.log(
          "Detected change in local storage, vodskipper property found, handling",
        )
        dispatch({
          type: "SET_ENABLED",
          payload: changes.vodskipper.newValue ?? false,
        })
      }
      // ! Remove this
      console.log(
        "Detected change in local storage, vodskipper property not found",
      )
    }

    browser.storage.onChanged.addListener(handleStorageChange)

    // browser.runtime.onMessage.addListener(popupListener)

    return () => {
      // browser.runtime.onMessage.removeListener(popupListener)
      browser.storage.onChanged.removeListener(handleStorageChange)
      tearDownListeners()
    }
  }, [])

  // finished loading useEffect
  useEffect(() => {
    if (state.error !== "") {
      // ! Remove this
      console.log("Some error happened, not setting up any listeners")
      return
      // TODO: Use shouldCreateListener fn
    } else if (state.mutedSegments.length === 0) {
      // ! Remove this
      console.log("No listeners, no data.")
      return
    }
    if (loaded && state.enabled) {
      console.log(`Loaded vod data from bg script.`)
      setupListeners()
    } else {
      console.log("Extension disabled currently.")
    }
  }, [loaded])

  // Re-establish the playing handler when
  // A new nearest segment is set
  useEffect(() => {
    // TODO: Use shouldCreateListener fn
    if (Object.prototype.hasOwnProperty.call(state.nearestSegment, "default")) {
      console.log("Default segment, returning")
      return
    }
    // ! Remove this
    console.log(
      `Nearest segment has changed: ${JSON.stringify(
        state.nearestSegment,
      )}, setting playing listener`,
    )
    video.addEventListener("playing", playingHandler)

    return () => {
      // ! Remove this
      console.log(
        `Nearest segment has changed: ${JSON.stringify(
          state.nearestSegment,
        )}, clearing playing listener`,
      )
      video.removeEventListener("playing", playingHandler)
    }
  }, [state.nearestSegment])

  useEffect(() => {
    tearDownListeners()
    if (state.enabled) {
      setupListeners()
    }
  }, [state.enabled])

  return null
}

export default ContentScript
