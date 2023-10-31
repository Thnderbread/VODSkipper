import React, { useState, useEffect, useReducer } from "react"
import browser from "webextension-polyfill"
import { SkipMethod, MutedVodSegment, State, Action } from "../types"

const DEFAULTSEGMENT = {
  startingOffset: 0,
  endingOffset: 0,
  duration: 0,
}

// const EXPIRES_IN = 259_000_000
const initialState: State = {
  defaultSkipMethod: "auto",
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
    case "SET_SKIP_METHOD":
      return { ...state, defaultSkipMethod: action.payload }
    default:
      return state
  }
}

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
        SkipMethod: userSettings?.settings?.SkipMethod || "auto",
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
      dispatch({ type: "SET_SKIP_METHOD", payload: settings.SkipMethod })
      dispatch({ type: "SET_MUTED_SEGMENTS", payload: settings.vodData[vodID] })
      // setDefaultSkipMethod(settings.SkipMethod)
      // setMutedSegments(settings.vodData[vodID])

      // TODO: Implement expiration? How? Session storage or manual cleanup check localStorage on each page load?
    } catch (error) {
      // TODO: Send this to error handler or whatever (some centralized error handler - kabana?)
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
      if (state.nearestSegment === undefined) {
        return
      }

      if (
        video.currentTime >= state.nearestSegment.startingOffset &&
        video.currentTime < state.nearestSegment.endingOffset
      ) {
        // check if the user tried to undo a skip
        // TODO: if listening for an undo and a user goes somewhere else, what will happen?
        if (state.defaultSkipMethod === "manual") {
          browser.browserAction.onClicked.addListener(() => {
            video.currentTime = state.nearestSegment.endingOffset
            // ? useReducer
            dispatch({
              type: "SET_PREV_MUTED_SEGMENT",
              payload: state.nearestSegment,
            })
            // setPrevMutedSegment(state.nearestSegment)
            dispatch({
              type: "SET_NEAREST",
              payload: findNearestMutedSegment(state.mutedSegments),
            })
          })
          // auto skip
        } else {
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

  return (
    <div className="absolute top-20 left-20">
      <div className="flex flex-col gap-4 p-4 shadow-sm bg-gradient-to-r from-purple-500 to-pink-500 w-96 rounded-md">
        <h1>Cat Facts!</h1>
        <button
          className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm disabled:opacity-75 w-48"
          disabled={loading}
          onClick={handleOnClick}
        >
          Get a Cat Fact!
        </button>
        <p className="text-white">{fact}</p>
      </div>
    </div>
  )
}
