import browser from "webextension-polyfill"
// import { messages } from "../popup/component"
import { ToggleSwitchWithLabel } from "../common/ToggleSwitch"
import React, { useState, useEffect, useReducer } from "react"
import { findInterval, handleSeek, performSkip } from "../functions"
import { SkipMethod, MutedVodSegment, State, Action } from "../types"

/**
 * Add a listener for when the enabled state is toggled?
 */
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

// const EXPIRES_IN = 259_000_000
const initialState: State = {
  enabled: true,
  skipped: false,
  mutedSegments: [],
  nearestSegment: DEFAULTSEGMENT,
  prevMutedSegment: DEFAULTSEGMENT,
}

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "SET_NEAREST":
      return { ...state, nearestSegment: action.payload }
    case "SET_MUTED_SEGMENTS":
      return { ...state, mutedSegments: action.payload }
    case "SET_PREV_MUTED_SEGMENT":
      return { ...state, prevMutedSegment: action.payload }
    case "SET_ENABLED":
      return { ...state, enabled: action.payload }
    case "SET_SKIPPED":
      return { ...state, skipped: action.payload }
    default:
      return state
  }
}

;(async () => {
  const video = document.querySelector("video")

  const [state, dispatch] = useReducer(reducer, initialState)

  if (video === null) {
    console.error("Can't find the video element on the page.")
    // ? message to popup script?
    return
  }

  /**
   * Capture vod id.
   */
  const vodID = document.location.pathname.split("/")[2]

  /**
   * Muted segment data for said vod.
   * TODO: type this response thingy.
   */
  const response = await browser.runtime.sendMessage({
    action: "getData",
    data: vodID,
  })

  if (response.data instanceof Error) {
    console.error("Bad token.")
    // await browser.runtime.sendMessage({ action: "update", data: "Bad token." })
    // ? send message to popup script?
    return
  } else if (response.data === undefined) {
    console.log("No muted segment data found for this vod.")
    // await browser.runtime.sendMessage({ action: "update", data: "No muted segment data found for this vod." })
    return
  }

  /**
   * Vod data is obtained at this point.
   *
   * listener = setInterval(skipFn, findInterval)
   * skipFn will set a variable to let extension know when a seek event
   *  - that comes from skipping was initiated internally.
   * This way, if the user skips around, the extension will know its them,
   *  - due to the absence of the skip variable.
   * At this point, the listener can be cleared,
   *  - and a new one can be created based on where the user is.
   * The listener should also be cleared and recalculated on pause.
   * How to have this happen forever though?
   *
   */

  const listener = setInterval(
    performSkip,
    findInterval(state.nearestSegment.startingOffset, video.currentTime),
  )

  /**
   * Probably cause issues, since onplaying will fire after
   * a skip event.
   * Should these be promises that get resolved before things
   */
  video.onplaying = () => listener
  video.onseeked = () => handleSeek
  video.onpause = () => clearInterval(listener)
})()
/**
 * Content Script:
 *
 *  Initiate request to bg script.
 *  Receive data and perform skips as necessary.
 *
 *  IIFE that:
 *    - captures the video element
 *    - gets the vod id
 *    - requests data from bg script.
 *    - Receives data. Performs skips based on it.
 *    - When a skip is performed, send the new time to popup script.
 */

export default () => {
  const [fact, setFact] = useState("Click the button to fetch a fact!")
  const [loading, setLoading] = useState(false)

  const [state, dispatch] = useReducer(reducer, initialState)

  const video = document.querySelector("video") as HTMLVideoElement

  // Flow:
  // retrieve VOD data & user skip method preference.
  // video.onplaying = listenForMutedSegments().
  // video.onseeked = handleSeek().

  // Update SkipMethod in localStorage once the user toggles it
  // useEffect(() => {
  //   const userSettings = JSON.parse(localStorage.getItem("vodskipper"))
  //   userSettings.SkipMethod = SkipMethod
  //   localStorage.setItem("vodskipper", JSON.stringify(userSettings))
  // }, [SkipMethod])

  async function handleOnClick() {
    console.log("Clicked!")
    setLoading(true)
    const { data } = await browser.runtime.sendMessage({ action: "fetch" })
    setFact(data)
    setLoading(false)
    console.log("Video: ", video)
  }

  /**
   * Retrieve the muted segment data for this VOD. Look in
   * local storage, or contact Twitch API if necessary.
   */
  async function fetchMutedSegments(): Promise<void> {
    // Sanity check to make sure video element exists
    if (!video) {
      return
    }

    const vodID = document.location.pathname.split("/")[2]

    // ! Fix this. Change skip method to enabled / disabled.
    try {
      /**
       * Retrieve current settings. Looking for skip method
       * as well as skip data for the current vod.
       */
      const userSettings = JSON.parse(localStorage.getItem("vodskipper") ?? "")

      /**
       * Create a dummy settings object. Using this as a template to
       * either add newly retrieved data, or to easily handle nonexistent
       * properties.
       */
      let settings = {
        enabled: userSettings?.settings?.enabled || true,
        vodData: userSettings?.settings?.vodData || {},
      } // initialize settings object

      /**
       * If there is no data for this vod, retrieve it using the bg script.
       * Add the new skip data to the settings object. Update localStorage
       * with the new settings.
       */
      if (userSettings?.settings?.vodData[vodID] === undefined) {
        const data = await browser.runtime.sendMessage({ vodID })

        if (data instanceof Error) {
          console.error(data)
          return
        }

        settings.vodData[vodID] = {
          mutedSegments: data,
          // exp: Date.now() + EXPIRES_IN
        }

        localStorage.setItem("vodskipper", JSON.stringify(settings))
      }

      /**
       * Set skip data and skip method that will be used when actually
       * skipping through the vod.
       */
      // ? useReducer
      dispatch({ type: "SET_ENABLED", payload: settings.enabled })
      dispatch({ type: "SET_MUTED_SEGMENTS", payload: settings.vodData[vodID] })
      // setDefaultSkipMethod(settings.SkipMethod)
      // setMutedSegments(settings.vodData[vodID])

      // TODO: Implement expiration? How? Session storage or manual cleanup check localStorage on each page load?
    } catch (error) {
      // TODO: Send this to error handler or whatever (some centralized error handler - kibana?)
      console.error(`Unable to fetch the skip data: ${error}`)
    }
  }

  /**
   * Looks for the muted segment closest to
   * the video's current time. If no segment
   * is found, the user has most likely passed all of them.
   * @returns The segment or undefined.
   */
  function findNearestMutedSegment(
    mutedSegments: MutedVodSegment[],
  ): MutedVodSegment {
    // don't bother skipping if a muted
    // segment will end in 3 seconds.
    const cutoffPoint = 3

    return (
      mutedSegments.find(segment => {
        if (video?.currentTime <= segment.startingOffset) {
          return segment
        } else if (video?.currentTime > segment.startingOffset) {
          if (video?.currentTime < segment.endingOffset - cutoffPoint) {
            return segment
          }
        }
      }) || DEFAULTSEGMENT
    )
  }

  /**
   * Listen for a muted segment during VOD playback.
   */
  function listenForMutedSegments(skipMethod: SkipMethod) {
    dispatch({
      type: "SET_NEAREST",
      payload: findNearestMutedSegment(state.mutedSegments),
    })
    // setNearestSegment(findNearestMutedSegment(mutedSegments))

    const DEFAULTINTERVAL = 1000
    /**
     * - Determine the interval for setInterval by getting the
     *    - distance from the current time to the next startingOffset.
     * - Verify the offset exists, and that the distance value is positive.
     * - If there's no offset, nearestSegment will be undefined, and
     *    - setInterval will return after DEFAULTINTERVAL's delay.
     * - If the distance value is negative, we're already inside a
     *    - mutedSegment. The skip will occur after a DEFAULTINTERVAL's delay.
     */
    const INTERVAL = state.nearestSegment?.startingOffset
      ? state.nearestSegment.startingOffset - video.currentTime > 0
        ? state.nearestSegment.startingOffset - video.currentTime
        : DEFAULTINTERVAL
      : DEFAULTINTERVAL

    /**
     * Set how long we should listen for an undo.
     * If the time until the next muted segment is
     * less than 5 seconds, we'll just listen for an undo
     * until that segment to be skipped is reached.
     */
    const UNDOTIMEOUT = INTERVAL > 5000 ? 5000 : INTERVAL

    /**
     * Check where we're at in the VOD.
     * Perform skip if necessary.
     * TODO: Fix to check length of keys.
     */
    setInterval(() => {
      /**
       * Nothing to wait for - no next segment.
       */
      if (state.nearestSegment === undefined) {
        return
      }

      if (
        video.currentTime >= state.nearestSegment.startingOffset &&
        video.currentTime < state.nearestSegment.endingOffset
      ) {
        if (state.enabled) {
          // ? useReducer
          video.currentTime = state.nearestSegment.endingOffset
          dispatch({
            type: "SET_PREV_MUTED_SEGMENT",
            payload: state.nearestSegment,
          })
          // setPrevMutedSegment(state.nearestSegment)
          dispatch({
            type: "SET_NEAREST",
            payload: findNearestMutedSegment(state.mutedSegments),
          })
        }
      }
    }, INTERVAL)
  }

  // return (
  //   <div className="flex flex-col gap-4 p-4 shadow-sm bg-black bg-opacity-100 p-4 w-96">
  //     <h1>VODSkipper</h1>
  //     <div className="border border-solid border-gray-700"></div>
  //     <div>
  //       <ToggleSwitchWithLabel
  //         switchTitle={"Prompt Me Before Skipping"}
  //         switchDescription={
  //           "Check to be prompted before skipping a muted section."
  //         }
  //         enabled={state.enabled}
  //         setEnabled={(enabled: boolean) => {
  //           !enabled
  //           dispatch({ type: "SET_ENABLED", payload: enabled })
  //         }}
  //       />
  //     </div>

  //     <div className="border border-solid border-gray-700"></div>

  //     <div
  //       hidden={false}
  //       className="text-center justify-center text-lg text-white mb-10"
  //     >
  //       {messages.passedAllSegmentsMessage}
  //     </div>
  //   </div>
  // )
}
