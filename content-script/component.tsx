import browser from "webextension-polyfill"
// import { messages } from "../popup/component"
import { ToggleSwitchWithLabel } from "../common/ToggleSwitch"
import React, { useState, useEffect, useReducer } from "react"
import {
  createListener,
  handleSeek,
  findNearestMutedSegment,
} from "../functions"
import {
  MutedVodSegment,
  State,
  Action,
  PopupMessage,
  GetDataResponse,
  NewListenerCodes,
  ResponseCallback,
} from "../types"
// import { BackgroundScriptResponse } from "../background"

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

// const EXPIRES_IN = 259_000_000 - for storage
const initialState: State = {
  error: "",
  enabled: true,
  skipped: false,
  mutedSegments: [],
  listener: undefined,
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
    case "SET_LISTENER":
      console.log(
        `In reducer, changing listener from ${JSON.stringify(
          state.listener,
        )} to ${JSON.stringify(action.payload)}`,
      )
      return { ...state, listener: action.payload }
    case "SET_ERROR":
      return { ...state, backgroundScriptError: action.payload }
    default:
      return state
  }
}

/**
 * Probably cause issues, since onplaying will fire after
 * a skip event.
 * Should these be promises that get resolved before things
 *
 * ALSO, can add the listener thing to state. That way a fn
 * can be made that sets the listener, and assigned to onplaying.
 * it also allows for structured clearing of the listener onpause.
 */
// video.onplaying = () => createListener(state, video, dispatch)
// video.onseeked = () => handleSeek(state, dispatch, browser)
// video.onpause = () => clearTimeout(state.listener)

/**
 * Content Script:
 *
 *  Initiate request to bg script.
 *  Receive data and perform skips as necessary.
 *
 *  IIFE that:
 *    - [✅] captures the video element
 *    - [✅] gets the vod id
 *    - [✅] requests data from bg script.
 *    - [🔃] Receives data. Performs skips based on it.
 *    - [❔] When a skip is performed, send the new time to popup script.
 */

/**
 * Process:
 * - On load, contact bg for data.
 * - Get the data. Find the nearest segment relative to current position.
 * - Clear any previous timeouts that may exist.
 * - Create a new timeout for skipping ahead.
 * - The fn should check if the user is within a segment's bounds. If they are, skip ahead.
 * - If it's before the bounds, calculate a new listener. Remove this one. (return specific code?)
 * - If it's after the bounds, calculate this a new listener. Remove this one.
 * - What about: creating a spare listener. If something is in the main one, store it in the spare.
 *  - UseEffect for the spare. If anything is ever there, clear it.
 * - When a seek happens, Clear any present listener. Trying to differentiate may just take too long.
 *  - On playing will create a new listener anyway, so might be better to just clear it.
 * - Pauses should clear all listeners.
 * - on seek should clear any listener present
 */

/**
 * Known issues:
 * [] Content script not sending getData message or response is not being received.
 * [] useEffect for checking for state.skipped doesn't work. For some reason, it only triggers on component load.
 *  - This could be because of poor implementation. Need to add handling for state.skipped in performSkip function?
 * [⚠️] The onplaying event triggers a lot. This is because the getData message is not being sent or received, but if there are no muted segments, there should not be a listener. The listener is still created and `DEFAULTINTERVAL` is still set, causing the onplaying handler function to be called ever `DEFAULTINTERVAL` seconds.
 *  - Solved by checking if nearestSegment has default property instead of seeing if it's undefined. Don't know if everything works when actual vod data is given.
 * [] Shit not working on reload. (some issue w/ browser polyfill - "document is not defined"?)
 */

const ContentScript: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const vodID = document.location.pathname.split("/")[2]
  const video = document.querySelector("video")!

  // using this format to take advantage of removeEventListener
  const seekedHandler = () => {
    // ! Remove this
    console.log("Seek detected!")
    if (state.mutedSegments.length > 0) {
      handleSeek(state, dispatch, browser, video)
    } else {
      // ! Remove this
      console.log("Not handling the seek, but here's some juice: 🧃")
    }
  }

  // create the listener only if there are muted segments
  const playingHandler = () => {
    // ! Remove this
    console.log("Video playing")
    if (state.mutedSegments.length > 0) {
      // ! Remove this
      console.log("There are some muted segments, creating a listener!")
      // ensure proper state information is passed to createListener
      // Make sure old listener is cleared and state is updated
      clearTimeout(state.listener)
      // await new Promise(resolve => setTimeout(resolve, 500))
      createListener(state, video, dispatch)
    } else {
      // ! Remove this
      console.log("No muted segments so no listener, but here's a pizza: 🍕")
    }
  }
  const pauseHandler = () => {
    // ! Remove this
    console.log("Video paused")
    if (state.listener !== undefined) {
      // ! Remove this
      console.log("Clearing listeners due to pause")
      clearTimeout(state.listener)
      dispatch({ type: "SET_LISTENER", payload: undefined })
    } else {
      // ! Remove this
      console.log("No listeners, but here's a hotdog: 🌭")
    }
  }

  const setupListeners = () => {
    // use playing instead of play to give the seekedHandler
    // extra time to clear the current listener before a new
    // one is created. It will still exist otherwise.
    video.addEventListener("playing", playingHandler)
    video.addEventListener("seeked", seekedHandler)
    video.addEventListener("pause", pauseHandler)
  }

  const tearDownListeners = () => {
    video.removeEventListener("playing", playingHandler)
    video.removeEventListener("seeked", seekedHandler)
    video.removeEventListener("pause", pauseHandler)
  }

  useEffect(() => {
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

    ;(async () => {
      const { data }: GetDataResponse = await browser.runtime.sendMessage({
        action: "getData",
        data: vodID,
      })
      // ! Remove this
      // console.log(`Received a response from bg!: ${data}`)
      if (data instanceof Error) {
        console.error(`Got an error! ${data}`)
        dispatch({ type: "SET_ERROR", payload: data.message })
      } else if (data.length === 0) {
        // Returning if there's no data
        // since initial reducer state has dummy data
        console.log(`Muted segments not found for vod ${vodID}.`)
        return
      } else {
        console.log(`Found ${data.length} muted segments for vod ${vodID}.`)
        dispatch({ type: "SET_MUTED_SEGMENTS", payload: data })
        dispatch({
          type: "SET_NEAREST",
          payload: findNearestMutedSegment(video, data),
        })
      }
    })()

    browser.runtime.onMessage.addListener(popupListener)

    return () => {
      browser.runtime.onMessage.removeListener(popupListener)
      tearDownListeners()
    }
  }, [])

  useEffect(() => {
    // console.log(
    //   `State.nearestSegment has changed!: ${
    //     state.nearestSegment
    //   } stringified: ${JSON.stringify(state.nearestSegment)}`,
    // )
    // console.log(
    //   `State.mutedSegments has changed!: ${
    //     state.mutedSegments
    //   } stringified: ${JSON.stringify(state.mutedSegments)}`,
    // )
    setupListeners()
  }, [state.nearestSegment, state.mutedSegments])

  useEffect(() => {
    console.log(`State.listener has changed to!:`)
    console.log(state.listener)
    console.log()
    // console.log(`Full state: ${JSON.stringify(state)}`)
    console.log()
    // if (state.listener === undefined) {
    //   console.log("Clearing listener in useEffect:", state.listener)
    //   clearTimeout(state.listener)
    // }
  }, [state.listener])

  useEffect(() => {
    if (state.skipped) {
      console.log("Clearing state.listener because state.skipped is true")
      clearTimeout(state.listener)
    }
  }, [state.skipped])
  // useEffect(() => {
  //   console.log("The video is now playing! (onplaying)")
  // }, [video.onplaying])

  // useEffect(() => {
  //   console.log(`A skip was something'd: ${state.skipped}`)
  // }, [state.skipped])

  return null
}

export default ContentScript

// export default () => {
//   const [fact, setFact] = useState("Click the button to fetch a fact!")
//   const [loading, setLoading] = useState(false)

//   const [state, dispatch] = useReducer(reducer, initialState)

//   const video = document.querySelector("video") as HTMLVideoElement

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

//   async function handleOnClick() {
//     console.log("Clicked!")
//     setLoading(true)
//     const { data } = await browser.runtime.sendMessage({ action: "fetch" })
//     setFact(data)
//     setLoading(false)
//     console.log("Video: ", video)
//   }

//   /**
//    * Retrieve the muted segment data for this VOD. Look in
//    * local storage, or contact Twitch API if necessary.
//    */
//   async function fetchMutedSegments(): Promise<void> {
// Sanity check to make sure video element exists
//     if (!video) {
//       return
//     }

//     const vodID = document.location.pathname.split("/")[2]

// ! Fix this. Change skip method to enabled / disabled.
//     try {
//       /**
//        * Retrieve current settings. Looking for skip method
//        * as well as skip data for the current vod.
//        */
//       const userSettings = JSON.parse(localStorage.getItem("vodskipper") ?? "")

//       /**
//        * Create a dummy settings object. Using this as a template to
//        * either add newly retrieved data, or to easily handle nonexistent
//        * properties.
//        */
//       let settings = {
//         enabled: userSettings?.settings?.enabled || true,
//         vodData: userSettings?.settings?.vodData || {},
//       } // initialize settings object

//       /**
//        * If there is no data for this vod, retrieve it using the bg script.
//        * Add the new skip data to the settings object. Update localStorage
//        * with the new settings.
//        */
//       if (userSettings?.settings?.vodData[vodID] === undefined) {
//         const data = await browser.runtime.sendMessage({ vodID })

//         if (data instanceof Error) {
//           console.error(data)
//           return
//         }

//         settings.vodData[vodID] = {
//           mutedSegments: data,
//           // exp: Date.now() + EXPIRES_IN
//         }

//         localStorage.setItem("vodskipper", JSON.stringify(settings))
//       }

//       /**
//        * Set skip data and skip method that will be used when actually
//        * skipping through the vod.
//        */
//       // ? useReducer
//       dispatch({ type: "SET_ENABLED", payload: settings.enabled })
//       dispatch({ type: "SET_MUTED_SEGMENTS", payload: settings.vodData[vodID] })
//       // setDefaultSkipMethod(settings.SkipMethod)
//       // setMutedSegments(settings.vodData[vodID])

//       // TODO: Implement expiration? How? Session storage or manual cleanup check localStorage on each page load?
//     } catch (error) {
//       // TODO: Send this to error handler or whatever (some centralized error handler - kibana?)
//       console.error(`Unable to fetch the skip data: ${error}`)
//     }
//   }

//   /**
//    * Looks for the muted segment closest to
//    * the video's current time. If no segment
//    * is found, the user has most likely passed all of them.
//    * @returns The segment or undefined.
//    */
//   function findNearestMutedSegment(
//     mutedSegments: MutedVodSegment[],
//   ): MutedVodSegment {
//     // don't bother skipping if a muted
//     // segment will end in 3 seconds.
//     const cutoffPoint = 3

//     return (
//       mutedSegments.find(segment => {
//         if (video?.currentTime <= segment.startingOffset) {
//           return segment
//         } else if (video?.currentTime > segment.startingOffset) {
//           if (video?.currentTime < segment.endingOffset - cutoffPoint) {
//             return segment
//           }
//         }
//       }) || DEFAULTSEGMENT
//     )
//   }

//   /**
//    * Listen for a muted segment during VOD playback.
//    */
//   function listenForMutedSegments(skipMethod: SkipMethod) {
//     dispatch({
//       type: "SET_NEAREST",
//       payload: findNearestMutedSegment(state.mutedSegments),
//     })
//     // setNearestSegment(findNearestMutedSegment(mutedSegments))

//     const DEFAULTINTERVAL = 1000
//     /**
//      * - Determine the interval for setInterval by getting the
//      *    - distance from the current time to the next startingOffset.
//      * - Verify the offset exists, and that the distance value is positive.
//      * - If there's no offset, nearestSegment will be undefined, and
//      *    - setInterval will return after DEFAULTINTERVAL's delay.
//      * - If the distance value is negative, we're already inside a
//      *    - mutedSegment. The skip will occur after a DEFAULTINTERVAL's delay.
//      */
//     const INTERVAL = state.nearestSegment?.startingOffset
//       ? state.nearestSegment.startingOffset - video.currentTime > 0
//         ? state.nearestSegment.startingOffset - video.currentTime
//         : DEFAULTINTERVAL
//       : DEFAULTINTERVAL

//     /**
//      * Set how long we should listen for an undo.
//      * If the time until the next muted segment is
//      * less than 5 seconds, we'll just listen for an undo
//      * until that segment to be skipped is reached.
//      */
//     const UNDOTIMEOUT = INTERVAL > 5000 ? 5000 : INTERVAL

//     /**
//      * Check where we're at in the VOD.
//      * Perform skip if necessary.
//      * TODO: Fix to check length of keys.
//      */
//     setInterval(() => {
//       /**
//        * Nothing to wait for - no next segment.
//        */
//       if (state.nearestSegment === undefined) {
//         return
//       }

//       if (
//         video.currentTime >= state.nearestSegment.startingOffset &&
//         video.currentTime < state.nearestSegment.endingOffset
//       ) {
//         if (state.enabled) {
//           // ? useReducer
//           video.currentTime = state.nearestSegment.endingOffset
//           dispatch({
//             type: "SET_PREV_MUTED_SEGMENT",
//             payload: state.nearestSegment,
//           })
//           // setPrevMutedSegment(state.nearestSegment)
//           dispatch({
//             type: "SET_NEAREST",
//             payload: findNearestMutedSegment(state.mutedSegments),
//           })
//         }
//       }
//     }, INTERVAL)
//   }

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
// }
