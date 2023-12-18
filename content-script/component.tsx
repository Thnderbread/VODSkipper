import reducer from "./reducer"
import browser from "webextension-polyfill"
// import { messages } from "../popup/component"
import { ToggleSwitchWithLabel } from "../common/ToggleSwitch"
import React, { useState, useEffect, useReducer, useRef } from "react"
import {
  createListener,
  handleSeek,
  findNearestMutedSegment,
  performSkip,
  fetchDataFromBGScript,
} from "../functions"
import {
  MutedVodSegment,
  State,
  PopupMessage,
  GetDataResponse,
  NewListenerCodes,
  ResponseCallback,
} from "../types"

/**
 * Default segment. Signals that there are
 * no more muted segments found.
 */
export const DEFAULTSEGMENT = {
  startingOffset: 0,
  endingOffset: 0,
  duration: 0,
  default: true,
}

const initialState: State = {
  error: "",
  enabled: true,
  skipped: false,
  mutedSegments: [],
  listener: undefined,
  spareListener: undefined,
  nearestSegment: DEFAULTSEGMENT,
  prevMutedSegment: DEFAULTSEGMENT,
}

const ContentScript: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const vodID = document.location.pathname.split("/")[2]
  const [loaded, setLoaded] = useState(false)
  const [attempts, setAttempts] = useState(2)
  const video = document.querySelector("video")!

  let listener = useRef<NodeJS.Timeout | undefined>(undefined)

  // using this format to take advantage of removeEventListener
  const seekedHandler = () => {
    // ! Remove this
    console.log("Seek detected!")
    if (state.mutedSegments.length > 0) {
      clearTimeout(listener.current)

      const nearest = findNearestMutedSegment(video, state.mutedSegments)
      console.log(`New nearest segment: ${JSON.stringify(nearest)}`)
      dispatch({ type: "SET_NEAREST", payload: nearest })
    } else {
      // ! Remove this
      console.log("Not handling the seek, but here's some juice: 🧃")
    }
  }

  // create the listener only if there are muted segments
  const playingHandler = () => {
    // deduct an attempt for useEffect
    // to pause and play video.
    if (attempts > 2 && !loaded) {
      setAttempts(attempts - 1)
      return
    }

    // ! Remove this
    console.log("Video playing")
    if (state.nearestSegment.hasOwnProperty("default")) {
      // ! Remove this
      // Segments are calculated on mount
      console.log(
        `Exiting playing handler because nearest is a default segment: ${JSON.stringify(
          state.nearestSegment,
        )}`,
      )
      return
    } else if (state.mutedSegments.length === 0) {
      // ! Remove this
      console.log("No muted segments so no listener, but here's a pizza: 🍕")
      return
    }

    const { startingOffset, endingOffset } = state.nearestSegment
    // ! Remove this
    console.log("There are some muted segments, creating a listener!")
    if (video.currentTime < startingOffset) {
      // ! Remove this
      // Creating a listener
      if (listener.current === undefined) {
        listener.current = createListener(startingOffset, video, endingOffset)
      } else {
        // ! Remove this
        console.log(
          `Listener is currently full, will not overwrite: ${listener.current}`,
        )
      }
    } else if (video.currentTime > startingOffset) {
      // if inside the muted segment but not past it
      if (video.currentTime < endingOffset) {
        // ! Remove this
        console.log(
          `Current time ${video.currentTime} is > starting offset ${startingOffset} but < ending offset ${endingOffset}, so skipping.`,
        )
        performSkip(video, startingOffset, endingOffset)
        console.log(
          "Setting nearest muted segment after skip (inside of segment).",
        )
        const nearest = findNearestMutedSegment(video, state.mutedSegments)
        dispatch({ type: "SET_NEAREST", payload: nearest })
      } else {
        // If the current position is ahead of the nearest segment
        // And it's not a default one
        // (This might be false when vod playback starts at 0 for example)
        console.log(
          `Seems I've passed the nearest muted segment ${JSON.stringify(
            state.nearestSegment,
          )}. Setting a new one.`,
        )
        const nearest = findNearestMutedSegment(video, state.mutedSegments)
        dispatch({ type: "SET_NEAREST", payload: nearest })
        console.log(`The new nearest: ${JSON.stringify(nearest)}`)
      }
    } else {
      // segment start time is equal to current time - add margin of error?
      // ! Remove this
      console.log(
        `segment start time: ${state.nearestSegment.startingOffset} is not > or < than current video time: ${video.currentTime} - skipping ahead.`,
      )
      performSkip(video, startingOffset, endingOffset)
      console.log("Setting nearest muted segment after skip.")
      const nearest = findNearestMutedSegment(video, state.mutedSegments)
      dispatch({ type: "SET_NEAREST", payload: nearest })
      // seek handler will clear listeners
    }
  }

  const pauseHandler = () => {
    // ! Remove this
    console.log("Video paused - clearing listeners")
    clearTimeout(listener.current)
    listener.current = undefined

    // clearTimeout(state.listener)
    // clearTimeout(state.spareListener)

    // dispatch({ type: "SET_SPARE_LISTENER", payload: undefined })
    // dispatch({ type: "SET_LISTENER", payload: undefined })
  }

  const setupListeners = () => {
    // use playing instead of play to give the seekedHandler
    // extra time to clear the current listener before a new
    // one is created. It will still exist otherwise.
    video.addEventListener("playing", playingHandler)
    video.addEventListener("seeked", seekedHandler)
    video.addEventListener("pause", pauseHandler)
  }

  /**
   * Remove every listener from state.
   * Remove every listener attached to video element.
   */
  const tearDownListeners = () => {
    video.removeEventListener("playing", playingHandler)
    video.removeEventListener("seeked", seekedHandler)
    video.removeEventListener("pause", pauseHandler)

    clearTimeout(listener.current)
  }

  // On mount useEffect
  useEffect(() => {
    ;(async () => {
      console.log("Starting bg script fetching")
      // TODO: DRY this up - redundancy in fetchDataFromBGScript fn
      const stuff = await fetchDataFromBGScript(vodID, browser, video)
      if (stuff instanceof Error || stuff === undefined) {
        console.log(`Something's wrong with stuff: ${stuff}`)
        return
      } else {
        console.log(`Stuff: ${stuff}`)
        dispatch({ type: "SET_MUTED_SEGMENTS", payload: stuff.segments })
        dispatch({ type: "SET_NEAREST", payload: stuff.nearest })
      }
      console.log("Done fetching shit and set in state!")
      setLoaded(true)
    })()

    console.log("The content script is le loaded!")

    const popupListener = (
      { action, data }: PopupMessage,
      sender: browser.Runtime.MessageSender,
      response: ResponseCallback,
    ) => {
      // from fetching bg script data.
      if (state.error) {
        response({ data: state.error })
        return
      }
      // ? Will this mess up if data === true?
      if (action === "setEnabled" && data === false) {
        // If the user disabled the extension,
        // cancel any active listeners
        // ! Remove this
        console.log(`Received a setEnabled message: ${action}`)
        tearDownListeners()
        clearTimeout(state.listener)
        response({ data: "Listeners cleared." })
        return
        // Make sure there are still muted segments
        // if a new listener was requested
      } else if (action === "newListener") {
        if (state.mutedSegments.length === 0) {
          response({ data: NewListenerCodes.NoMutedSegmentData })
          return
        }
        // If segment is not a default, there's data to process
        if (!state.nearestSegment.hasOwnProperty("default")) {
          setupListeners()
          clearTimeout(state.listener)
          response({ data: NewListenerCodes.RegisteredNewListener })
          return
        } else {
          response({ data: NewListenerCodes.NoMutedSegmentDetected })
          return
        }
      }
    }

    browser.runtime.onMessage.addListener(popupListener)

    return () => {
      browser.runtime.onMessage.removeListener(popupListener)
      tearDownListeners()
    }
  }, [])

  // finished loading useEffect
  useEffect(() => {
    console.log(`Loaded vod data from bg script.`)
    setupListeners()
  }, [loaded])

  // Re-establish the playing handler when
  // A new nearest segment is set
  useEffect(() => {
    console.log("Nearest segment has changed, setting playing listener")
    video.addEventListener("playing", playingHandler)

    return () => {
      console.log("Nearest segment has changed, clearing playing listener")
      video.removeEventListener("playing", playingHandler)
    }
  }, [state.nearestSegment])
  // When an attempt is deducted, pause and replay the video
  // to re-trigger the onplaying event with current state data
  // useEffect(() => {
  //   console.log(`${attempts} Left`)
  //   video.pause()
  //   video.play()
  // }, [attempts])

  return null
}

export default ContentScript
